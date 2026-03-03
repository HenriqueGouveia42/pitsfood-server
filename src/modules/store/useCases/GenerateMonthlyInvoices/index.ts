import { GenerateMonthlyInvoicesUseCase } from "./GenerateMonthlyInvoicesUseCase.js";

import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { AbacatePayProvider } from "../../../../shared/providers/PaymentProvider/implementations/AbacatePayProvider.js";
import { PrismaSubscriptionInvoiceRepository } from "../../repositories/implementations/prisma/subscriptionInvoice.repository.prisma.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const userRepositoru: PrismaUserRepository = new PrismaUserRepository();
const abacatePayProvider: AbacatePayProvider = new AbacatePayProvider();
const subscriptionInvoiceProvider: PrismaSubscriptionInvoiceRepository = new PrismaSubscriptionInvoiceRepository();

const generateMonthlyInvoicesUseCase: GenerateMonthlyInvoicesUseCase = new GenerateMonthlyInvoicesUseCase(
    storeRepository,
    userRepositoru,
    abacatePayProvider,
    subscriptionInvoiceProvider
);

export { generateMonthlyInvoicesUseCase }