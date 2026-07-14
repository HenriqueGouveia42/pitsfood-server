import { AppError } from "../../../../../shared/errors/AppError.js";
import type { ISubscriptionInvoiceRepository } from "../../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { StoreActivationService } from "../../../services/uow/StoreActivationService.js";
import { SubscriptionInvoice } from "../../../entities/subscriptionInvoice.js";
import { PLAN_LIMITS } from "../../../../../config/plans.config.js";
import { SubscriptionPlan } from "../../../entities/store.enums.js";

export interface IWebhookRequest {
    event: string;
    data: {
        transparent: {
            id: string;
            status: string;
            amount: number;
            metadata?: Record<string, any>;
        };
    };
}

// 1 - Validar de Entrada baseadas na documentação oficial v2 do abacate pay
// 2 - Buscar e validar a fatura interna do sistema pitsfood
// 3 - Ativar a loja

export class HandleAbacateWebhookUseCase { 
    
    constructor(
        private invoiceRepository: ISubscriptionInvoiceRepository,
        private storeActivationService: StoreActivationService
    ) {}

    async execute({ event, data }: IWebhookRequest): Promise<void> {

        // 1
        if (event !== "transparent.completed") throw new AppError(`[Webhook] Ignorando evento ${event} (esperado: transparent.completed)`);
        
        const transaction = data?.transparent;
        if (!transaction) throw new AppError("[Webhook] Objeto 'transparent' ausente no escopo do data.", 422, "TRANSACTION_OBJECT_MISSING");
        
        const gatewayTransactionId: string = transaction.id;
        if (!gatewayTransactionId)  throw new AppError("[Webhook] ERRO CRÍTICO: ID da transação não encontrado no payload!", 422, "TRANSACTION_ID_MISSING");
        
        const gatewayTransactionStatus: string = transaction.status;
        if (gatewayTransactionStatus !== "PAID") throw new AppError(`[Webhook] Evento é transparent.completed, mas status dentro do objeto é ${gatewayTransactionStatus}. Investigar.`, 422, "EVENT_STATUS_MISMATCH");

        const internalInvoiceId: string | undefined = transaction.metadata?.internal_invoice_id;

       
        // 2 
        const entityInvoice: SubscriptionInvoice | null = await this.invoiceRepository.findByGatewayId(gatewayTransactionId);
        
        if (!entityInvoice) {
            console.error(`[Webhook - Falback] Fatura gatewayId ${gatewayTransactionId} não encontrada. Internal Invoice ID: ${internalInvoiceId}`);
            throw new AppError(`[Webhook] ERRO FATAL: Fatura ${gatewayTransactionId} NÃO encontrada no banco de dados!`, 422, "INVOICE_MISSING");
        }

        if (entityInvoice.status === "PAID") throw new AppError(`[Webhook] A fatura ${gatewayTransactionId} já consta como PAGA no banco. Ignorando.`, 422, "INVOICE_ALREADY_PAID");
        
        if (!entityInvoice.periodEnd) throw new AppError(`[Webhook] ERRO CRÍTICO: A fatura ${entityInvoice.id} não possui data de vencimento (dueDate). Impossível calcular a expiração do plano.`, 500, "MISSING_INVOICE_TARGET_DATE");
        
        const plan: SubscriptionPlan = entityInvoice.planTag;

        if (!PLAN_LIMITS[plan]) throw new AppError(`Plano desconhecido ou inválido: ${plan}`, 500);
        

        const entity_invoice_expires_at: Date = new Date(entityInvoice.periodEnd);

        // 3
        await this.storeActivationService.execute({
            storeId: entityInvoice.storeId,
            plan: plan,
            expirationDate: entity_invoice_expires_at,
            invoiceToMarkAsPaid: entityInvoice // Esse argumento é opcional 
        });
        
    }
}