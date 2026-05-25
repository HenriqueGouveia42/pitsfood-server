import { AppError } from "../../../../shared/errors/AppError.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { StoreActivationService } from "../../services/StoreActivationService.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";
import { PLAN_LIMITS } from "../../../../config/plans.config.js";

export interface IWebhookRequest {
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
        private invoiceRepository: ISubscriptionInvoiceRepository,
        private storeActivationService: StoreActivationService
    ) {}

    async execute({ event, data }: IWebhookRequest): Promise<void> {

        const gatewayBillingId: string = data.billing?.id;
        const gatewayBillingStatus: string = data.billing?.status;

        // 1. Validações de Entrada (Fronteira HTTP/Webhook)
        if (event !== "billing.paid") throw new AppError(`[Webhook] Ignorando evento ${event} (esperado: billing.paid)`)
        if (!gatewayBillingId) throw new AppError("[Webhook] ERRO CRÍTICO: ID da fatura (data.billing.id) não encontrado no payload!", 422, "INVOICE_ID_MISSING")
        if (gatewayBillingStatus !== "PAID") throw new AppError(`[Webhook] Evento é billing.paid, mas status dentro do objeto é ${gatewayBillingStatus}. Investigar.`, 422, "EVENT_STATUS_MISMATCH");
           
        // 2. Busca e Validação de Regras de Negócio Iniciais
        const entityInvoice: SubscriptionInvoice | null  = await this.invoiceRepository.findByGatewayId(gatewayBillingId);
        
        if (!entityInvoice) throw new AppError(`[Webhook] ERRO FATAL: Fatura ${gatewayBillingId} NÃO encontrada no banco de dados!`, 422, "INVOICE_MISSING")
        if (entityInvoice.status === "PAID") throw new AppError(`[Webhook] A fatura ${gatewayBillingId} já consta como PAGA no banco. Ignorando.`, 422, "INVOICE_ALREADY_PAID")
        if (!entityInvoice.periodEnd) throw new AppError(`[Webhook] ERRO CRÍTICO: A fatura ${entityInvoice.id} não possui data de vencimento (dueDate). Impossível calcular a expiração do plano.`, 500, "MISSING_INVOICE_TARGET_DATE")

        const plan = entityInvoice.planTag;
        if (!PLAN_LIMITS[plan]) throw new AppError(`Plano desconhecido ou inválido: ${plan}`, 500);

        const entity_invoice_expires_at: Date =  new Date(entityInvoice.periodEnd);

        // 3. LÓGICA ATOMICA TRANSACIONAL
        await this.storeActivationService.execute({
            storeId: entityInvoice.storeId,
            plan: plan,
            expirationDate: entity_invoice_expires_at,
            invoiceToMarkAsPaid: entityInvoice
        });
        
    }
}