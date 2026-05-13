import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import { cacheProvider } from "../../../../shared/providers/CacheProvider/index.js";
import { PhysicalBill as EntityPhysicalBill, PhysicalBill } from "../../../bill/entities/physicalBIllCard.js";
import { PLAN_LIMITS } from "../../../../config/plans.config.js";
import { Store, SubscriptionPlan } from "../../entities/store.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";

import { generateValid4DigitsPhysicalCodes } from "../../../bill/functions/GenerateValidPhysicalBillCodes.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

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
//ISSO É ATIVADO ASSIM QUE O POST DO ABACATE PAY CHEGA NA ROTA '/webhook/payment' deste server

//1 - ATIVACAO DA LOJA
//2 - ATUALIZACAO DA FATURA INTERNA PARA PAGA
//3 - GERACAO DAS COMANDAS FISICAS
//4 - INVALIDACAO DO DO CACHE KEY ANTIGO DE LOJA DESATUALIZADA

export class HandleAbacateWebhookUseCase { //recebeu o webhook do abacate pay
    constructor(
        private storeRepository: IStoreRepository,
        private invoiceRepository: ISubscriptionInvoiceRepository
    ) {}

    async execute({ event, data }: IWebhookRequest): Promise<void> {

        const gatewayBillingId: string = data.billing?.id;
        const gatewayBillingStatus: string = data.billing?.status;

        if (event !== "billing.paid") throw new AppError(`[Webhook] Ignorando evento ${event} (esperado: billing.paid)`)
        if (!gatewayBillingId) throw new AppError("[Webhook] ERRO CRÍTICO: ID da fatura (data.billing.id) não encontrado no payload!", 422, "INVOICE_ID_MISSING")
        
        const entityInvoice: SubscriptionInvoice | null  = await this.invoiceRepository.findByGatewayId(gatewayBillingId);
        if (!entityInvoice) throw new AppError(`[Webhook] ERRO FATAL: Fatura ${gatewayBillingId} NÃO encontrada no banco de dados!`, 422, "INVOICE_MISSING")
        if (entityInvoice.status === "PAID") throw new AppError(`[Webhook] A fatura ${gatewayBillingId} já consta como PAGA no banco. Ignorando.`, 422, "INVOICE_ALREADY_PAID")
        if (!entityInvoice.periodEnd) throw new AppError(`[Webhook] ERRO CRÍTICO: A fatura ${entityInvoice.id} não possui data de vencimento (dueDate). Impossível calcular a expiração do plano.`, 500, "MISSING_INVOICE_TARGET_DATE")

        if (gatewayBillingStatus !== "PAID") throw new AppError(`[Webhook] Evento é billing.paid, mas status dentro do objeto é ${gatewayBillingStatus}. Investigar.`, 422, "EVENT_STATUS_MISMATCH");
           

        const plan: SubscriptionPlan = entityInvoice.planTag;
        if (!PLAN_LIMITS[plan]) throw new AppError(`Plano desconhecido ou inválido: ${plan}`, 500);

        const store: Store | null = await this.storeRepository.findSavedStoreById(entityInvoice.storeId);
        if (!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");

        const entity_invoice_expires_at: Date =  new Date(entityInvoice.periodEnd);
        const physical_bills_quantity: number = PLAN_LIMITS[plan].limits.max_physical_bills;
        const codes: Set<string> = generateValid4DigitsPhysicalCodes(physical_bills_quantity);

        const now_date: string = new Date().toISOString();
        const activatedStore: Store = store.activatePlan(plan, entity_invoice_expires_at);
        const paidInvoice: SubscriptionInvoice = entityInvoice.markAsPaid(now_date);
        const physical_bills: Set<PhysicalBill> = PhysicalBill.buildManyPhysicallBills(codes, entityInvoice.storeId);

        await this.storeRepository.saveActivationTransaction(
            activatedStore,
            paidInvoice,
            physical_bills
        )

        const cache_key: string = CacheKeys.Store.SUBSCRIPTION_STATUS(activatedStore.id);

        await cacheProvider.invalidate(cache_key);
        
    }
}