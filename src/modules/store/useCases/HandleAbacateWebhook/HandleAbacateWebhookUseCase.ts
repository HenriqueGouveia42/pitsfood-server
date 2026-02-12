import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import { cacheProvider } from "../../../../shared/providers/CacheProvider/index.js";
import { PhysicalBill as EntityPhysicalBill } from "../../../bill/entities/physicalBIllCard.js";
import { PLAN_LIMITS } from "../../../../config/plans.config.js";
import { SubscriptionPlan } from "../../entities/store.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";

interface IWebhookRequest {
    event: string;
    data: {
        billing: {
            id: string;
            status: string;
            amount: number;
        }
    }
}

export class HandleAbacateWebhookUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private invoiceRepository: ISubscriptionInvoiceRepository
    ) {}

    async execute({ event, data }: IWebhookRequest): Promise<void> {

        const gatewayBillingId = data.billing?.id;
        const billingStatus = data.billing?.status;

        //debug -> console.log(`[webhook] Evento recebido: ${event}`);

        if (event !== "billing.paid") throw new AppError(`[Webhook] Ignorando evento ${event} (esperado: billing.paid)`)
          
        if (!gatewayBillingId) throw new AppError("[Webhook] ERRO CRÍTICO: ID da fatura (data.billing.id) não encontrado no payload!", 422, "INVOICE_ID_MISSING")
        
        //debug -> console.log(`🔎 [Webhook] Buscando fatura com ID: ${gatewayBillingId}`);

        const invoice: SubscriptionInvoice | null  = await this.invoiceRepository.findByGatewayId(gatewayBillingId);

        if (!invoice) throw new AppError(`[Webhook] ERRO FATAL: Fatura ${gatewayBillingId} NÃO encontrada no banco de dados!`, 422, "INVOICE_MISSING")

        //idempotência
        //verificamos se jã está paga no banco OU se o webhook diz que não é PAID (vai que...)
        if (invoice.status === "PAID") throw new AppError(`ℹ️ [Webhook] A fatura ${gatewayBillingId} já consta como PAGA no banco. Ignorando.`, 422, "INVOICE_ALREADY_PAID")
           
        if (billingStatus !== "PAID") throw new AppError(`[Webhook] Evento é billing.paid, mas status dentro do objeto é ${billingStatus}. Investigar.`, 422, "EVENT_STATUS_MISMATCH");
           
        //debug -> console.log(`✅ [Webhook] Fatura encontrada para a loja: ${invoice.storeId}. Iniciando ativação...`);

        const expiresAt = invoice.dueDate ? new Date(invoice.dueDate) : new Date();

        // --- LÓGICA DE GERAÇÃO DE COMANDAS (MANTIDA IGUAL) ---
        const codigos = new Set<string>();
        const plan: SubscriptionPlan = invoice.planTag;
        
        if (!PLAN_LIMITS[plan]) {
            throw new AppError(`Plano desconhecido ou inválido: ${plan}`, 500);
        }

        const physical_bills_quantity: number = PLAN_LIMITS[plan].limits.max_physical_bills;

        let attempts: number = 0;
        const maxAttempts = physical_bills_quantity * 20;
        
        while (codigos.size < physical_bills_quantity && attempts < maxAttempts){
            attempts++;
            const randomInt = Math.floor(Math.random() * 9999) + 1;
            const formatedCode = randomInt.toString().padStart(4, '0');
            codigos.add(formatedCode);
        }

        if (codigos.size < physical_bills_quantity) {
             throw new AppError("Não foi possivel gerar codigos únicos suficientes", 500, "ERROR_QUANTITY_PHYSICAL_BILLS");
        }

        let physical_bills: EntityPhysicalBill[] = [];
        
        for (const codigo of codigos){
            const physical_bill = EntityPhysicalBill.buildPhysicalBill(
                codigo,
                invoice.storeId
            )
            physical_bills.push(physical_bill)
        }

        // Ativação no Banco
        await this.storeRepository.activateSubscription(
            invoice.storeId,
            invoice.id,
            invoice.planTag,
            expiresAt,
            physical_bills
        );

        // Invalidação do Cache
        await cacheProvider.invalidate(`store-subscription-status:${invoice.storeId}`);

        console.log(`🚀 [Webhook] SUCESSO! Loja ${invoice.storeId} ativada e cache limpo.`);
    }
}