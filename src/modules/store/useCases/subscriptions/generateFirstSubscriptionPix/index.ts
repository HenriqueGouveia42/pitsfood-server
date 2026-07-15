import { GenerateFirstSubscriptionPixUseCase } from "./GenerateFirstSubscriptionPixUseCase.js";
import { GenerateFirstSubscriptionPixController } from "./GenerateFirstSubscriptionPixController.js";

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

const generateSubscriptionPixUseCase = new GenerateFirstSubscriptionPixUseCase(
    storeRepository,
    userRepository,
    paymentProvider,
    invoiceRepository,
    calculator
);

const generateFirstSubscriptionPixController = new GenerateFirstSubscriptionPixController(generateSubscriptionPixUseCase);

export { generateFirstSubscriptionPixController };