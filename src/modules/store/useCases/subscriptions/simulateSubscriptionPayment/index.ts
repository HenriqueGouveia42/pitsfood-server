import { SimulateSubscriptionPaymentController } from "./SimulateSubscriptionPaymentController.js";
import { SimulateSubscriptionPaymentUseCase } from "./SimulateSubscriptionPaymentUseCase.js";

import { PrismaSubscriptionInvoiceRepository } from "../../../repositories/implementations/prisma/subscriptionInvoice.repository.prisma.js";
import { AbacatePayProvider } from "../../../../../shared/providers/PaymentProvider/implementations/AbacatePayProvider.js";

const paymentProvider: AbacatePayProvider = new AbacatePayProvider();

const subscriptionInvoiceRepository: PrismaSubscriptionInvoiceRepository = 
    new PrismaSubscriptionInvoiceRepository();

const simulateSubscriptionPaymentUseCase: SimulateSubscriptionPaymentUseCase = 
    new SimulateSubscriptionPaymentUseCase(
        subscriptionInvoiceRepository,
        paymentProvider
    );

const simulateSubscriptionPaymentController: SimulateSubscriptionPaymentController =
    new SimulateSubscriptionPaymentController(
        simulateSubscriptionPaymentUseCase
    )

export { simulateSubscriptionPaymentController }