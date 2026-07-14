import { HandleAbacateWebhookUseCase } from "./HandleAbacateWebhookUseCase.js";
import { HandleAbacateWebhookController } from "./HandleAbacateWebhookController.js";

import { PrismaSubscriptionInvoiceRepository } from "../../../repositories/implementations/prisma/subscriptionInvoice.repository.prisma.js";
import { StoreActivationService } from "../../../services/uow/StoreActivationService.js";
import { PrismaUnitOfWork } from "../../../../../shared/infra/uow/implementations/PrismaUnitOfWork.js";
import { RedisCacheProvider } from "../../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const uow: PrismaUnitOfWork = new PrismaUnitOfWork();

const storeActivationService: StoreActivationService = new StoreActivationService(
    uow,
    cacheProvider
);

const invoiceRepository: PrismaSubscriptionInvoiceRepository = new PrismaSubscriptionInvoiceRepository();

const handleAbacateWebhookUseCase: HandleAbacateWebhookUseCase = new HandleAbacateWebhookUseCase(
    invoiceRepository,
    storeActivationService
);

const handleAbacateWebhookController = new HandleAbacateWebhookController(
    handleAbacateWebhookUseCase
);

export { handleAbacateWebhookController };