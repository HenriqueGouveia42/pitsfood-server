import { GenerateRenewalInvoicesUseCase } from "./GenerateRenewalInvoicesUseCase.js";

import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaSubscriptionInvoiceRepository } from "../../repositories/implementations/prisma/subscriptionInvoice.repository.prisma.js";
import { AbacatePayProvider } from "../../../../shared/providers/PaymentProvider/implementations/AbacatePayProvider.js";
import { SubscriptionCalculator } from "../../providers/SubscriptionCalculator.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const invoiceRepository: PrismaSubscriptionInvoiceRepository = new PrismaSubscriptionInvoiceRepository();
const paymentProvider: AbacatePayProvider = new AbacatePayProvider();
const subscriptionCalculator: SubscriptionCalculator = new SubscriptionCalculator();

const generateRenewalInvoicesUseCase: GenerateRenewalInvoicesUseCase
 = new GenerateRenewalInvoicesUseCase(
    storeRepository,
    userRepository,
    invoiceRepository,
    paymentProvider,
    subscriptionCalculator
)

export { generateRenewalInvoicesUseCase }