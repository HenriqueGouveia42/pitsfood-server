import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { IPaymentProvider } from "../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import { SubscriptionCalculator } from "../../providers/SubscriptionCalculator.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";
import { PLAN_LIMITS } from "../../../../config/plans.config.js";
import { Store, SubscriptionStatus, SubscriptionPlan } from "../../entities/store.js";
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

                const cleanTaxId: string = owner.cpf_cnpj.replace(/\D/g, "");
                const customerId: string = await this.paymentProvider.createCustomer({
                    name: owner.username,
                    email: owner.email,
                    taxId: cleanTaxId,
                    cellphone: owner.phone || "(00) 00000-0000"
                });

                // O PIX expira no dia exato do vencimento da loja
                const pixDueDate: Date = new Date(store.subscription_expires_at!);

                const paymentData = await this.paymentProvider.createPixPayment({
                    customerId: customerId,
                    amount_in_cents: amount_in_cents,
                    description: `Renovação Mensal Pitstop - ${store.plan}`,
                    dueDate: pixDueDate
                });

                const invoice = SubscriptionInvoice.buildInvoice({
                    now_date: new Date().toISOString(),
                    invoice_id: crypto.randomUUID(),
                    amount_in_cents,
                    store_id: store.id,
                    plan_tag: store.plan,
                    period_end: target_date.toISOString(), // A data calculada pelo seu calculador
                    gateway_data: {
                        gateway_invoice_id: paymentData.payment_id,
                        payment_url: paymentData.payment_url,
                        pix_code: ""
                    }
                });

                await this.invoiceRepository.save(invoice);

            } catch (error) {
                console.error(`[CRON] Erro ao gerar fatura para loja ${store.id}:`, error);
            }
        }
    }
}