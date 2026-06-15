import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import { SubscriptionCalculator } from "../../providers/SubscriptionCalculator.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";
import { Store } from "../../entities/store.js";
import { SubscriptionPlan } from "../../entities/store.enums.js";
import type { User } from "../../../user/entities/user.js";
import crypto from "crypto";

export class GenerateRenewalInvoicesUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private invoiceRepository: ISubscriptionInvoiceRepository,
        private calculator: SubscriptionCalculator
    ) {}

    public async execute(): Promise<void> {
        const targetDate: Date = new Date();
        targetDate.setDate(targetDate.getDate() + 5);

        const storesExpiringSoon: Store[] = await this.storeRepository.findStoresExpiringOn(targetDate);

        if (storesExpiringSoon.length === 0) return;

        for (const store of storesExpiringSoon) {
            try {
                if (store.plan === SubscriptionPlan.NONE) continue;

                const hasPending: SubscriptionInvoice | null = await this.invoiceRepository.findPendingByStoreId(store.id);
                if (hasPending) continue;

                const owner: User | null = await this.userRepository.findSavedUserById(store.ownerId);
                if (!owner) continue;

                const baseDate: Date = new Date(store.subscription_expires_at!);
                const { amount_in_cents, target_date: calculation_target_date } = this.calculator.calculateInvoice(store.plan, baseDate);

                // instancia a fatura omitindo os dados do gateway (ficarão nulos no banco)
                const invoice = SubscriptionInvoice.buildInvoice({
                    now_date: new Date().toISOString(),
                    invoice_id: crypto.randomUUID(),
                    amount_in_cents,
                    store_id: store.id,
                    plan_tag: store.plan,
                    period_end: calculation_target_date.toISOString()
                });

                await this.invoiceRepository.save(invoice);

            } catch (error) {
                console.error(`[CRON] Erro ao gerar fatura para loja ${store.id}:`, error);
            }
        }
    }
}