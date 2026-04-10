import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import { SubscriptionPlan } from "../../../../generated/prisma/enums.js";
import type { IPaymentProvider } from "../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import type { SubscriptionCalculator } from "../../providers/SubscriptionCalculator.js";

export class GenerateRenewalInvoicesUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private invoiceRepository: ISubscriptionInvoiceRepository,
        private paymentProvider: IPaymentProvider,
        private calculator: SubscriptionCalculator
    ){}

    
}