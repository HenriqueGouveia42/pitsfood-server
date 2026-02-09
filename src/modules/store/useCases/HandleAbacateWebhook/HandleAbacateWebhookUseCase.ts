import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import { SubscriptionStatus } from "../../entities/store.js";
import { cacheProvider } from "../../../../shared/providers/CacheProvider/index.js";
import { prisma } from "../../../../shared/infra/prisma.js";
import { PhysicalBill as EntityPhysicalBill } from "../../../bill/entities/physicalBIllCard.js";
import { PLAN_LIMITS } from "../../../../config/plans.config.js";
import { SubscriptionPlan } from "../../entities/store.js";

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

        //buscar a Fatura (Leitura não precisa de transação)
        const invoice = await this.invoiceRepository.findByGatewayId(data.id);

        if (!invoice) return; // Log e return
        if (invoice.status === "PAID") return; // Idempotência

        //define a nova validade (Regra de Negócio)
        const expiresAt = invoice.dueDate ? new Date(invoice.dueDate) : new Date();

        //criamos as comandas fisicas
        const codigos = new Set<string>();
        const plan: SubscriptionPlan = invoice.planTag;
        const physical_bills_quantity: number = PLAN_LIMITS[plan].limits.max_physical_bills;

        let attempts: number = 0;
        const maxAttempts = physical_bills_quantity * 20; //margem de seguranca caso por alguma razao satânica o while trave
        
        while (codigos.size < physical_bills_quantity && attempts < maxAttempts){
            
            attempts++;

            const randomInt = Math.floor(Math.random() * 9999) + 1;
            const formatedCode = randomInt.toString().padStart(4, '0');
            codigos.add(formatedCode);
        }

        //se cair no if quer dizer que passamos da quantidade maxima de tentavias
        if (codigos.size < physical_bills_quantity) throw new AppError("Não foi possivel gerar codigos únicos suficientes", 500, "ERROR_QUANTITY_PHYSICAL_BILLS");

        let physical_bills: EntityPhysicalBill[] = [];
        let physical_bill: EntityPhysicalBill;
        
        for (const codigo of codigos){
            
            physical_bill = EntityPhysicalBill.buildPhysicalBill(
                codigo,
                invoice.storeId
            )

            physical_bills.push(physical_bill)
        }

        //aqui garantimos que PAGAMENTO + ATIVAÇÃO + CRIACAO DAS PRIMEIRAS COMADNAS FÍSICAS ocorram juntos
        await this.storeRepository.activateSubscription(
            invoice.storeId,
            invoice.id,
            invoice.planTag,
            expiresAt,
            physical_bills
        );

        //limpar Cache (Isso fica fora da transação do banco, pois é Redis)
        await cacheProvider.invalidate(`store-subscription-status:${invoice.storeId}`);

        console.log(`[Webhook] Sucesso! Loja ${invoice.storeId} ativada e fatura ${invoice.id} baixada.`);
    }
}