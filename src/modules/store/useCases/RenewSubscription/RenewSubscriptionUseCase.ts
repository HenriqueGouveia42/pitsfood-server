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
import type { BuildSubscriptionInvoiceProps } from "../../entities/subscriptionInvoice.js";

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

        // 1. Busca e Validações Iniciais
        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");

        const owner: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!owner) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        if (owner.role !== UserRole.GESTOR) throw new AppError("Acesso negado: Apenas o gestor pode renovar a assinatura.", 401, "ROLE_UNAUTHORIZED");

        // 2. Trava Lógica: Verifica se a loja possui um plano contratado
        if (store.plan === SubscriptionPlan.NONE) {
            throw new AppError("Esta loja não possui um plano base para renovar.", 400, "NO_PLAN_TO_RENEW");
        }
        
        // 3. Trava de Idempotência: Verifica se já existe uma fatura de renovação pendente
        const pendingInvoice: SubscriptionInvoice | null = await this.invoiceRepository.findPendingByStoreId(store.id);

        const now: Date = new Date();

        if (pendingInvoice) { 
            const invoiceCreationTime: number = new Date(pendingInvoice.createdAt).getTime();
            const ageInHours: number = (now.getTime() - invoiceCreationTime) / (1000 * 60 * 60);

            // Se o QR Code do PIX já venceu, cancela a fatura e deixa o fluxo continuar para gerar uma nova
            if (ageInHours >= PAYMENT_CONFIG.PIX_EXPIRATION_HOURS) {
                const canceledInvoice: SubscriptionInvoice = pendingInvoice.markAsCanceled();
                await this.invoiceRepository.update(canceledInvoice);

            } else { 
                // Se NÃO venceu, devolvemos a mesma fatura para evitar cobrança duplicada
                if (!pendingInvoice.paymentUrl) {
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
        }

        // 4. Cálculo do Valor e Validade (A Regra do Aniversário de Pagamento)
        let baseDateForCalculation: Date;

        if (store.subscription_status === SubscriptionStatus.PAST_DUE || store.subscription_status === SubscriptionStatus.CANCELED) {
            // Pagamento Atrasado: O ciclo é resetado e 1 mês começa a contar a partir de HOJE.
            baseDateForCalculation = now;
        } else {
            // Pagamento em Dia (Antecipado): Soma 1 mês em cima da data de vencimento atual.
            if (!store.subscription_expires_at) {
                throw new AppError("Erro de integridade: Loja ativa sem data de expiração.", 500, "MISSING_EXPIRATION_DATE");
            }
            baseDateForCalculation = new Date(store.subscription_expires_at);
        }

        const { amount_in_cents, target_date } = this.subscriptionCalculator.calculateInvoice(store.plan, baseDateForCalculation);

        // 5. Prepara os dados do cliente para o Gateway
        const cleanTaxId = owner.cpf_cnpj.replace(/\D/g, "");

        const gatewayCustomerId = await this.paymentProvider.createCustomer({
            name: owner.username,
            email: owner.email,
            taxId: cleanTaxId,
            cellphone: owner.phone ? owner.phone : "(00) 00000-0000"
        });

        // 6. Define o vencimento do QR Code do PIX (O cliente tem 24h para pagar ESTA tentativa)
        const pixExpirationDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // 7. Chama o Gateway (AbacatePay)
        const paymentData = await this.paymentProvider.createPixPayment({
            customerId: gatewayCustomerId,
            amount_in_cents: amount_in_cents,
            description: `Renovação de Assinatura - Plano ${store.plan}`,
            dueDate: pixExpirationDate
        });

        // 8. Cria e salva a Fatura no Banco
        // O `period_end` armazena o target_date. Quando o Webhook confirmar o pagamento, 
        // é essa data que será injetada no `subscription_expires_at` da loja.
        const build_props: BuildSubscriptionInvoiceProps = {
            now_date: now.toISOString(),
            invoice_id: crypto.randomUUID().toString(),
            amount_in_cents,
            store_id: store.id,
            plan_tag: store.plan,
            period_end: target_date.toISOString(),
            gateway_data: {
                gateway_invoice_id: paymentData.payment_id,
                payment_url: paymentData.payment_url,
                pix_code: "" 
            }
        };
        
        const invoice: SubscriptionInvoice = SubscriptionInvoice.buildInvoice(build_props);
        await this.invoiceRepository.save(invoice);

        return {
            payment_url: paymentData.payment_url,
            amount: amount_in_cents,
            invoice_id: invoice.id
        };
    }
}