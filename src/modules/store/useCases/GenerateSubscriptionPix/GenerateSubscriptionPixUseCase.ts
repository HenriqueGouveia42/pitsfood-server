import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import type { IPaymentProvider } from "../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import { SubscriptionCalculator } from "../../providers/SubscriptionCalculator.js";
import { SubscriptionPlan, SubscriptionStatus } from "../../entities/store.enums.js";
import { Store } from "../../entities/store.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { User } from "../../../user/entities/user.js";
import type { BuildSubscriptionInvoiceProps } from "../../entities/subscriptionInvoice.js";

interface IRequest {
    store_id: string;
    user_id: string;
    plan: SubscriptionPlan; 
}

interface IResponse {
    payment_url: string;
    amount: number;
    invoice_id: string;
}

export class GenerateSubscriptionPixUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private paymentProvider: IPaymentProvider,
        private invoiceRepository: ISubscriptionInvoiceRepository,
        private calculator: SubscriptionCalculator
    ) {}

    async execute({ store_id, user_id, plan }: IRequest): Promise<IResponse> {
        
        
        if (plan === SubscriptionPlan.NONE) { throw new AppError("Plano inválido.", 400, "MUST_CHOOSE_PLAN"); }
        if (!Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan)) { throw new AppError("Plano inválido.", 400, "INVALID_PLAN_TYPE"); }

        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja não encontrada.", 404, "STORE_NOT_FOUND");

        const owner: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!owner) throw new AppError("Dono não encontrado.", 404, "USER_NOT_FOUND");

        // 3 - TRAVA DE SEGURANÇA 1: Assinatura Ativa
        if (store.subscription_status === SubscriptionStatus.ACTIVE) {
            throw new AppError(
                "Sua loja já possui uma assinatura ativa. Aguarde o vencimento para renovar.", 
                409,
                "SUBSCRIPTION_ALREADY_ACTIVE"
            );
        }

        // 4 - TRAVA DE SEGURANÇA 2: Fatura Pendente (Idempotência)
        const pendingInvoice: SubscriptionInvoice | null = await this.invoiceRepository.findPendingByStoreId(store_id);
        
        if (pendingInvoice) {

            if (!pendingInvoice.paymentUrl) throw new AppError("Erro grave de integração. Fatura existe no sistema mas sem payment url do gateway", 500, "INVOICE_WITHOUT_PAYMENT_URL");

            if (pendingInvoice.planTag === plan) {
                return {
                    payment_url: pendingInvoice.paymentUrl,
                    amount: pendingInvoice.amount,
                    invoice_id: pendingInvoice.id
                };
            }

            throw new AppError(
                "Você já possui uma fatura pendente para outro plano. Aguarde ela expirar ou entre em contato com o suporte.",
                409,
                "PENDING_INVOICE_EXISTS"
            );
        }

        // 5 - Cálculo da Fatura (Mês Cheio) usando a data atual como base
        const now = new Date();
        const { amount_in_cents, target_date } = this.calculator.calculateInvoice(plan, now);

        // 6 - Prepara dados do cliente para o Gateway
        const rawTaxId: string | undefined = owner.cpf_cnpj;

        if(!rawTaxId) throw new AppError("Usuario que tenta gerar fatura obrigatoriamente possui um cpf/cnpj", 500, "INVALID_USER");

        const cleanTaxId = rawTaxId.replace(/\D/g, "");

        const gatewayCustomerId = await this.paymentProvider.createCustomer({
            name: owner.username,
            email: owner.email,
            taxId: cleanTaxId,
            cellphone: owner.phone ? owner.phone : "(00) 00000-0000"
        });

        // 7 - Vencimento do PIX (QR Code) - 24 horas
        // O cliente tem 24h para pagar ESTE código Pix.
        const pixDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // 8 - Cria o Pagamento no Gateway
        const paymentData = await this.paymentProvider.createPixPayment({
            customerId: gatewayCustomerId,
            amount_in_cents: amount_in_cents,
            description: `Assinatura ${plan} (1 Mês)`, //Descrição clara
            dueDate: pixDueDate 
        });

        // 9 - Salva a fatura no nosso banco.
        // Atenção: O dueDate da Fatura é o target_date do plano (ex: 1 mês à frente),
        // pois é essa data que o Webhook usará para ativar a loja.

        const invoice_id: string = crypto.randomUUID();

        const build_invoice_props: BuildSubscriptionInvoiceProps = {
            now_date: now.toISOString(),
            invoice_id,
            amount_in_cents,
            store_id: store.id,
            plan_tag: plan,
            period_end: target_date.toISOString(),
            gateway_data:{
                gateway_invoice_id: paymentData.payment_id,
                pix_code: "",
                payment_url: paymentData.payment_url 
            
            }

        }

        const invoice: SubscriptionInvoice = SubscriptionInvoice.buildInvoice(build_invoice_props);

        await this.invoiceRepository.save(invoice);

        return {
            payment_url: paymentData.payment_url,
            amount: amount_in_cents,
            invoice_id: invoice.id
        };
    }
}