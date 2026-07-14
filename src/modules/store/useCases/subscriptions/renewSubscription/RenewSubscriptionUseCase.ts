import { AppError } from "../../../../../shared/errors/AppError.js";
import { SubscriptionStatus, SubscriptionPlan } from "../../../entities/store.enums.js";
import { Store } from "../../../entities/store.js";
import type { IStoreRepository } from "../../../repositories/interfaces/store.repository.interface.js";
import { SubscriptionCalculator } from "../../../providers/SubscriptionCalculator.js";
import type { IPaymentProvider } from "../../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import { User, UserRole } from "../../../../user/entities/user.js";
import type { IUserRepository } from "../../../../user/repositories/interfaces/user.repository.interface.js";
import { SubscriptionInvoice } from "../../../entities/subscriptionInvoice.js";
import type { ISubscriptionInvoiceRepository } from "../../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { BuildSubscriptionInvoiceProps } from "../../../entities/subscriptionInvoice.js";
import crypto from "crypto";

interface IRenewSubscriptionUseCaseRequest {
    store_id: string;
    user_id: string;
}

interface IResponse {
    payment_url: string;
    amount: number;
    invoice_id: string;
}

export class RenewSubscriptionUseCase {

    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private invoiceRepository: ISubscriptionInvoiceRepository,
        private subscriptionCalculator: SubscriptionCalculator,
        private paymentProvider: IPaymentProvider
    ) {}

    async execute({ store_id, user_id }: IRenewSubscriptionUseCaseRequest): Promise<IResponse> {

        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");

        const owner: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!owner) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        if (owner.role !== UserRole.GESTOR) throw new AppError("Acesso negado: Apenas o gestor pode renovar a assinatura.", 401, "ROLE_UNAUTHORIZED");
        if (store.ownerId !== user_id) throw new AppError("Usuario não é o proprietario da loja", 401, "MUST_BE_THE_STORE_OWNER");
        if (store.plan === SubscriptionPlan.NONE) throw new AppError("Esta loja não possui um plano base para renovar.", 400, "NO_PLAN_TO_RENEW");
        
        let targetInvoice: SubscriptionInvoice | null = await this.invoiceRepository.findPendingByStoreId(store.id);
        const now: Date = new Date();

        // Se a fatura existe e já possui PIX gerado, retornamos ela (Idempotência)
        if (targetInvoice && targetInvoice.gatewayInvoiceId) {
            return {
                payment_url: targetInvoice.paymentUrl || "",
                amount: targetInvoice.amount,
                invoice_id: targetInvoice.id
            };
        }

        let amount_in_cents = 0;
        let invoice_id = "";

        // se a fatura existe mas não tem PIX (veio do Cron), vamos atualizá-la
        if (targetInvoice && !targetInvoice.gatewayInvoiceId) {
            amount_in_cents = targetInvoice.amount;
            invoice_id = targetInvoice.id;
        } 
        // fallback: Se o Cron falhou e a fatura não existe, criamos uma do zero
        else {
            let baseDateForCalculation = (store.subscription_status === SubscriptionStatus.PAST_DUE || store.subscription_status === SubscriptionStatus.CANCELED) 
                ? now 
                : new Date(store.subscription_expires_at!);

            const calculation = this.subscriptionCalculator.calculateInvoice(store.plan, baseDateForCalculation);
            amount_in_cents = calculation.amount_in_cents;
            invoice_id = crypto.randomUUID().toString();
            
            const build_props: BuildSubscriptionInvoiceProps = {
                now_date: now.toISOString(),
                invoice_id,
                amount_in_cents,
                store_id: store.id,
                plan_tag: store.plan,
                period_end: calculation.target_date.toISOString()
            };
            
            targetInvoice = SubscriptionInvoice.buildInvoice(build_props);
            await this.invoiceRepository.save(targetInvoice);
        }

        const cleanTaxId = owner.cpf_cnpj ? owner.cpf_cnpj.replace(/\D/g, "") : "";

        // chama o gateway V2 usando o Checkout Transparente
        const paymentData = await this.paymentProvider.createTransparentPix({
            amount: amount_in_cents,
            description: `Renovação de Assinatura - Plano ${store.plan}`,
            expiresIn: 86400, // 24 horas cravadas a partir do clique do usuário
            customer: {
                name: owner.username,
                email: owner.email,
                taxId: cleanTaxId,
                cellphone: owner.phone || "(00) 00000-0000"
            },
            metadata: {
                internal_invoice_id: invoice_id
            }
        });

        // adiciona os dados reais de cobrança à fatura lógica e atualiza no banco
        const updatedInvoice = targetInvoice.addGatewayDetails(
            paymentData.id,
            paymentData.brCode,
            paymentData.brCodeBase64
        );

        await this.invoiceRepository.update(updatedInvoice);

        return {
            payment_url: paymentData.brCodeBase64, // O front pode usar isso para renderizar o QR Code
            amount: amount_in_cents,
            invoice_id: invoice_id
        };
    }
}