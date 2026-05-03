import { AppError } from "../../../../shared/errors/AppError.js";
import { Store, SubscriptionStatus, SubscriptionPlan } from "../../entities/store.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import { SubscriptionCalculator } from "../../providers/SubscriptionCalculator.js";
import type { IPaymentProvider } from "../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import { User } from "../../../user/entities/user.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import { UserRole } from "../../../user/entities/user.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import { PAYMENT_CONFIG } from "../../../../config/payment.config.js";

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

        // 1. Busca e Validações
        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");

        const owner: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!owner) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        if (owner.role !== UserRole.GESTOR) throw new AppError("Acesso negado: Apenas o gestor pode renovar a assinatura.", 401, "ROLE_UNAUTHORIZED");

        // 2. Trava Lógica: Só permite renovar quem realmente precisa
        if (store.subscription_status === SubscriptionStatus.ACTIVE) throw new AppError("Sua loja já possui uma assinatura ativa.", 409, "SUBSCRIPTION_ALREADY_ACTIVE");
        
        if (store.plan === SubscriptionPlan.NONE) throw new AppError("Esta loja não possui um plano base para renovar.", 400, "NO_PLAN_TO_RENEW");
        
        // 3. Trava de Idempotência: Verifica se já existe uma fatura de renovação pendente
        const pendingInvoice: SubscriptionInvoice | null = await this.invoiceRepository.findPendingByStoreId(store.id);

        if (pendingInvoice) { //o qr code pix pode ou não está vencido

            const invoiceCreationTime: number = new Date(pendingInvoice.createdAt).getTime();
            const nowTime: number = new Date().getTime();
            const ageInHours:number = (nowTime - invoiceCreationTime) / (1000*60*60)

            //qr code pix vencido
            if (ageInHours >= PAYMENT_CONFIG.PIX_EXPIRATION_HOURS){
                
                const canceledInvoice: SubscriptionInvoice = pendingInvoice.markAsCanceled();
                await this.invoiceRepository.update(canceledInvoice);

            } else { //qr code pix NAO vencido

                if (!pendingInvoice.paymentUrl){
                    throw new AppError(
                        "Erro de integridade: Fatura pendente localizada, mas o link de pagamento está ausente. Contate o suporte.", 
                        500, 
                        "MISSING_PAYMENT_URL"
                    );
                }

                return {
                    payment_url: pendingInvoice.paymentUrl,
                    amount: pendingInvoice.amount,
                    invoice_id: pendingInvoice.id
                };
            }
        } //vamos gerar uma fatura agora

        // 4. Cálculo do Valor e Validade (1 Mês Cheio a partir de hoje)
        const now = new Date();
        const { amount_in_cents, target_date } = this.subscriptionCalculator.calculateInvoice(store.plan, now);

        // 5. Prepara os dados do cliente (Limpando o CPF/CNPJ de pontuações)
        const cleanTaxId = owner.cpf_cnpj.replace(/\D/g, "");

        const gatewayCustomerId = await this.paymentProvider.createCustomer({
            name: owner.username,
            email: owner.email,
            taxId: cleanTaxId,
            cellphone: owner.phone ? owner.phone : "(00) 00000-0000"
        });

        // 6. Define o vencimento do QR Code do PIX (ex: 24 horas para pagar)
        const pixExpirationDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // 7. Chama o Gateway (AbacatePay)
        const paymentData = await this.paymentProvider.createPixPayment({
            customerId: gatewayCustomerId,
            amount_in_cents: amount_in_cents,
            description: `Renovação de Assinatura - Plano ${store.plan}`,
            dueDate: pixExpirationDate
        });

        // 8. Cria e salva a Fatura no Banco
        // O Webhook usará este target_date para liberar a loja por 1 mês
        const invoice = SubscriptionInvoice.buildInvoice(
            amount_in_cents,
            store.id,
            store.plan,
            target_date.toISOString(), 
            {
                gateway_invoice_id: paymentData.payment_id,
                payment_url: paymentData.payment_url,
                pix_code: "" 
            }
        );

        await this.invoiceRepository.save(invoice);

        return {
            payment_url: paymentData.payment_url,
            amount: amount_in_cents,
            invoice_id: invoice.id
        };
    }
}