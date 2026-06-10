import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { IPaymentProvider } from "../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import { SubscriptionCalculator } from "../../providers/SubscriptionCalculator.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";
import { PLAN_LIMITS } from "../../../../config/plans.config.js";
import { Store } from "../../entities/store.js";
import { SubscriptionStatus, SubscriptionPlan } from "../../entities/store.enums.js";
import type { User } from "../../../user/entities/user.js";

export class GenerateRenewalInvoicesUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private invoiceRepository: ISubscriptionInvoiceRepository,
        private paymentProvider: IPaymentProvider,
        private calculator: SubscriptionCalculator
    ) {}

    public async execute(): Promise<void> {
        
        // Data alvo: daqui a 5 dias.
        const targetDate: Date = new Date();
        targetDate.setDate(targetDate.getDate() + 5);

        const storesExpiringSoon: Store[] = await this.storeRepository.findStoresExpiringOn(targetDate);

        if (storesExpiringSoon.length === 0) return;

        for (const store of storesExpiringSoon) {

            try {
                if (store.plan === SubscriptionPlan.NONE) continue;

                // Evita duplicidade se o cron rodar duas vezes
                const hasPending: SubscriptionInvoice | null = await this.invoiceRepository.findPendingByStoreId(store.id);
                if (hasPending) continue;

                const owner: User | null = await this.userRepository.findSavedUserById(store.ownerId);
                if (!owner) continue;

                // Aqui está o segredo: A baseDate é a data de VENCIMENTO ATUAL, não o dia de hoje!
                // Assim o cliente ganha 1 mês a partir do momento em que a loja ia bloquear.
                const baseDate: Date = new Date(store.subscription_expires_at!);
                const { amount_in_cents, target_date } = this.calculator.calculateInvoice(store.plan, baseDate);

                if (!owner.cpf_cnpj){
                    throw new AppError("Este usuário deveria ter um cpf/cnpj", 500, "MUST_HAVE_CPF_CNPJ")
                }
                
                const cleanTaxId: string = owner.cpf_cnpj.replace(/\D/g, "");


                // O PIX expira no dia exato do vencimento da loja.
                const pixDueDate: Date = new Date(store.subscription_expires_at!);
                const expiresInSeconds = Math.floor((pixDueDate.getTime() - Date.now()) / 1000);

                // Novo fluxo da V2: Criar Checkout Transparente direto (engloba os dados do cliente no mesmo payload)
                const paymentData = await this.paymentProvider.createTransparentPix({
                    amount: amount_in_cents,
                    description: `Renovação Mensal Pitsfood - ${store.plan}`,
                    expiresIn: expiresInSeconds > 0 ? expiresInSeconds : 86400, // Fallback de segurança para 24h
                    customer: {
                        name: owner.username,
                        email: owner.email,
                        taxId: cleanTaxId,
                        cellphone: owner.phone || "00000000000"
                    }
                });

                const invoice = SubscriptionInvoice.buildInvoice({
                    now_date: new Date().toISOString(),
                    invoice_id: crypto.randomUUID(),
                    amount_in_cents,
                    store_id: store.id,
                    plan_tag: store.plan,
                    period_end: target_date.toISOString(), 
                    gateway_data: {
                        gateway_invoice_id: paymentData.id,
                        payment_url: null, // V2 não depende de URL de redirecionamento
                        pix_code: paymentData.brCode // O código PIX Copia e Cola real gerado pelo gateway
                    }
                });

                await this.invoiceRepository.save(invoice);

            } catch (error) {
                console.error(`[CRON] Erro ao gerar fatura para loja ${store.id}:`, error);
            }
        }
    }
}