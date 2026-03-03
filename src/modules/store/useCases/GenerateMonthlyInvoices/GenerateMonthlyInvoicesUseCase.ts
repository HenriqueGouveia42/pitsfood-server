import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import type { IPaymentProvider } from "../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";
import { PLAN_LIMITS } from "../../../../config/plans.config.js";

export class GenerateMonthlyInvoicesUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private paymentProvider: IPaymentProvider,
        private invoiceRepository: ISubscriptionInvoiceRepository
    ) {}

    public async execute(): Promise<void> {
        
        console.log("[CRON] 20:00 - Iniciando geração de faturas mensais...");

        //1 - Busca todas as lojas ativas e em dia
        const activeStores = await this.storeRepository.findActiveStores();

        if (activeStores.length === 0) {
            console.log("[CRON] Nenhuma loja ativa encontrada para faturamento.");
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        // 2. Processa cada loja individualmente
        // Em um cenário de altíssima escala, isso deveria ser jogado em uma fila (SQS/RabbitMQ/BullMQ)
        // Para nossa escala, um loop for...of assíncrono é perfeitamente seguro e evita estourar o limite de requisições da Abacate Pay.
        for (const store of activeStores) {
            try {
                
                // Pula lojas que estão no plano gratuito temporário (se houver)
                if (store.plan === 'NONE') continue;

                //2.1 - Pega o preço cheio do plano
                const planConfig = PLAN_LIMITS[store.plan];
                if (!planConfig || !planConfig.price_in_cents) {
                    throw new AppError(`Plano ${store.plan} não configurado corretamente.`, 500);
                }

                //2.2 - Busca os dados do Dono (para gerar a cobrança)
                const owner = await this.userRepository.findSavedUserById(store.ownerId);
                if (!owner) throw new AppError(`Dono (ID: ${store.ownerId}) não encontrado.`, 404);

                //2.3 - Cria ou resgata o Customer no Abacate Pay
                const rawTaxId: string = owner.cpf_cnpj;
                const cleanTaxId: string = rawTaxId.replace(/\D/g, "");

                const gatewayCustomerId = await this.paymentProvider.createCustomer({
                    name: owner.username,
                    email: owner.email,
                    taxId: cleanTaxId,
                    cellphone: owner.phone ? owner.phone : "(00) 00000-0000"
                });

                //2.4 - Define o vencimento para o dia 28 deste mês
                const now = new Date();
                const dueDate = new Date(now.getFullYear(), now.getMonth(), 28, 23, 59, 59);

                //2.5 - Cria a Cobrança no Abacate Pay
                const paymentData = await this.paymentProvider.createPixPayment({
                    customerId: gatewayCustomerId,
                    amount_in_cents: planConfig.price_in_cents,
                    description: `Assinatura Mensal Pitstop - ${store.plan}`,
                    dueDate: dueDate
                });

                //2.6 - Persiste a fatura no nosso banco de dados
                const invoice = SubscriptionInvoice.buildInvoice(
                    planConfig.price_in_cents,
                    store.id,
                    store.plan,
                    dueDate.toISOString(),
                    {
                        gateway_invoice_id: paymentData.payment_id,
                        payment_url: paymentData.payment_url,
                        pix_code: "" // O webhook pode atualizar isso depois, ou sua UI pode extrair da URL
                    }
                );

                await this.invoiceRepository.save(invoice);
                
                successCount++;

            } catch (error) {
                // Logamos o erro específico dessa loja, mas continuamos o loop para não prejudicar as outras
                console.error(`[CRON] Erro ao gerar fatura para a loja ${store.id}:`, error);
                errorCount++;
            }
        }

        console.log(`[CRON] Faturamento concluído. Sucesso: ${successCount} | Erros: ${errorCount}`);
    }
}