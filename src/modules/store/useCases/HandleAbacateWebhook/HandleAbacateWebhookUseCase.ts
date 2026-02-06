import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import { SubscriptionStatus } from "../../entities/store.js";
import { cacheProvider } from "../../../../shared/providers/CacheProvider/index.js";
import { prisma } from "../../../../shared/infra/prisma.js";

interface IWebhookRequest {
    event: string; // Ex: "billing.paid"
    data: {
        id: string; // ID da cobrança no AbacatePay
        status: string;
        amount: number;
    }
}

export class HandleAbacateWebhookUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private invoiceRepository: ISubscriptionInvoiceRepository
    ) {}

    async execute({ event, data }: IWebhookRequest): Promise<void> {
        // ... validações de evento ...

        // 1. Buscar a Fatura (Leitura não precisa de transação)
        const invoice = await this.invoiceRepository.findByGatewayId(data.id);

        if (!invoice) return; // Log e return
        if (invoice.status === "PAID") return; // Idempotência

        // 2. Define a nova validade (Regra de Negócio)
        const expiresAt = invoice.dueDate ? new Date(invoice.dueDate) : new Date();

        // 3. OPERAÇÃO ATÔMICA (Transação)
        // Aqui garantimos que PAGAMENTO + ATIVAÇÃO ocorrem juntos
        await this.storeRepository.activateSubscription(
            invoice.storeId,
            invoice.id,
            invoice.planTag,
            expiresAt
        );

        // 4. Limpar Cache (Isso fica fora da transação do banco, pois é Redis)
        await cacheProvider.invalidate(`store-subscription-status:${invoice.storeId}`);

        console.log(`[Webhook] Sucesso! Loja ${invoice.storeId} ativada e fatura ${invoice.id} baixada.`);
    }
}