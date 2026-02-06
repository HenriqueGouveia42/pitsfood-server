import { HandleAbacateWebhookUseCase } from "./HandleAbacateWebhookUseCase.js";
import { HandleAbacateWebhookController } from "./HandleAbacateWebhookController.js";

// Repositórios necessários
import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaSubscriptionInvoiceRepository } from "../../repositories/implementations/prisma/subscriptionInvoice.repository.prisma.js";

// 1. Instanciar Repositórios
const storeRepository = new PrismaStoreRepository();
const invoiceRepository = new PrismaSubscriptionInvoiceRepository();

// 2. Injetar no UseCase
// Esse UseCase usa o invoiceRepository para achar a fatura e o storeRepository para ativar a loja
const handleAbacateWebhookUseCase = new HandleAbacateWebhookUseCase(
    storeRepository,
    invoiceRepository
);

// 3. Injetar no Controller
const handleAbacateWebhookController = new HandleAbacateWebhookController(
    handleAbacateWebhookUseCase
);

export { handleAbacateWebhookController };