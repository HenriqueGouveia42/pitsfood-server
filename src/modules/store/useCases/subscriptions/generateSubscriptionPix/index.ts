import { GenerateSubscriptionPixUseCase } from "./GenerateSubscriptionPixUseCase.js";
import { GenerateSubscriptionPixController } from "./GenerateSubscriptionPixController.js";

//repos
import { PrismaStoreRepository } from "../../../repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaSubscriptionInvoiceRepository } from "../../../repositories/implementations/prisma/subscriptionInvoice.repository.prisma.js";

//providers
import { AbacatePayProvider } from "../../../../../shared/providers/PaymentProvider/implementations/AbacatePayProvider.js";
import { SubscriptionCalculator } from "../../../providers/SubscriptionCalculator.js";

const storeRepository = new PrismaStoreRepository();
const userRepository = new PrismaUserRepository();
const invoiceRepository = new PrismaSubscriptionInvoiceRepository(); // O novo repo que criamos
const paymentProvider = new AbacatePayProvider(); // O provider que fala com o Abacate
const calculator: SubscriptionCalculator = new SubscriptionCalculator();

const generateSubscriptionPixUseCase = new GenerateSubscriptionPixUseCase(
    storeRepository,
    userRepository,
    paymentProvider,
    invoiceRepository,
    calculator
);

const generateSubscriptionPixController = new GenerateSubscriptionPixController(generateSubscriptionPixUseCase);

export { generateSubscriptionPixController };