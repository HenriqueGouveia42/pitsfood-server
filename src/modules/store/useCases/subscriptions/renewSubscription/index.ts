import { RenewSubscriptionController } from "./RenewSubscriptionController.js";
import { RenewSubscriptionUseCase } from "./RenewSubscriptionUseCase.js";

import { PrismaStoreRepository } from "../../../repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaSubscriptionInvoiceRepository } from "../../../repositories/implementations/prisma/subscriptionInvoice.repository.prisma.js";
import { SubscriptionCalculator } from "../../../providers/SubscriptionCalculator.js";
import { AbacatePayProvider } from "../../../../../shared/infra/providers/implementations/paymentProvider/AbacatePayProvider.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const invoiceRepository: PrismaSubscriptionInvoiceRepository = new PrismaSubscriptionInvoiceRepository();
const subscriptionCalculator: SubscriptionCalculator = new SubscriptionCalculator();
const paymentProvider: AbacatePayProvider = new AbacatePayProvider();

const renewSubscriptionUseCase: RenewSubscriptionUseCase = 
    new RenewSubscriptionUseCase(
        storeRepository,
        userRepository,
        invoiceRepository,
        subscriptionCalculator,
        paymentProvider
    );

const renewSubscriptionController: RenewSubscriptionController = 
    new RenewSubscriptionController(
        renewSubscriptionUseCase
    );

export { renewSubscriptionController }
