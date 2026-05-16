import { SubscriptionInvoice, InvoiceStatus as EntityInvoiceStatus } from "../../../entities/subscriptionInvoice.js";
import { SubscriptionPlan as EntityPlan } from "../../../entities/store.js";
import type { ISubscriptionInvoiceRepository } from "../../interfaces/subscriptionInvoice.repository.interface.js"; 
import { prisma } from "../../../../../shared/infra/prisma.js";

import { InvoiceStatus as PrismaInvoiceStatus } from "../../../../../generated/prisma/client.js";
import { SubscriptionPlan as PrismaPlan } from "../../../../../generated/prisma/client.js";
import type { SubscriptionInvoice as PrismaInvoice } from "../../../../../generated/prisma/client.js";


export class PrismaSubscriptionInvoiceRepository implements ISubscriptionInvoiceRepository {

    // -------------------------------------------------------------------------
    // MAPPERS (Convertem do Banco para Entidade e vice-versa)
    // -------------------------------------------------------------------------

    private static prismaToEntityMapper(prismaInvoice: PrismaInvoice): SubscriptionInvoice {
        return SubscriptionInvoice.restore({
            invoice_id: prismaInvoice.invoice_id,
            amount_in_cents: prismaInvoice.amount_in_cents,
            currency: prismaInvoice.currency,
            status: prismaInvoice.status as EntityInvoiceStatus,
            
            gateway_invoice_id: prismaInvoice.gateway_invoice_id,
            pix_code: prismaInvoice.pix_code,
            payment_url: prismaInvoice.payment_url,

            created_at: prismaInvoice.created_at.toISOString(),
            paid_at: prismaInvoice.paid_at ? prismaInvoice.paid_at.toISOString() : null,
            period_end: prismaInvoice.period_end.toISOString(),

            store_id: prismaInvoice.store_id,
            plan_tag: prismaInvoice.plan_tag as EntityPlan
        });
    }

    private static entityToPrismaMapper(invoice: SubscriptionInvoice): PrismaInvoice {

        const props = invoice.getProps;

        return {
            invoice_id: props.invoice_id,
            amount_in_cents: props.amount_in_cents,
            currency: props.currency,
            status: props.status as PrismaInvoiceStatus,
            
            gateway_invoice_id: props.gateway_invoice_id, 
            pix_code: props.pix_code,
            payment_url: props.payment_url,

            created_at: new Date(props.created_at),
            paid_at: props.paid_at ? new Date(props.paid_at) : null,

            period_end: new Date(props.period_end),

            store_id: props.store_id,
            plan_tag: props.plan_tag as unknown as PrismaPlan
        };
    }

    // -------------------------------------------------------------------------
    // MÉTODOS DO REPOSITÓRIO
    // -------------------------------------------------------------------------

    async save(invoice: SubscriptionInvoice): Promise<void> {
        const data = PrismaSubscriptionInvoiceRepository.entityToPrismaMapper(invoice);

        await prisma.subscriptionInvoice.create({
            data: data
        });
    }

    async findById(invoice_id: string): Promise<SubscriptionInvoice | null> {
        const prismaData = await prisma.subscriptionInvoice.findUnique({
            where: { invoice_id }
        });

        if (!prismaData) return null;

        return PrismaSubscriptionInvoiceRepository.prismaToEntityMapper(prismaData);
    }

    async update(invoice: SubscriptionInvoice): Promise<void> {
        const data = PrismaSubscriptionInvoiceRepository.entityToPrismaMapper(invoice);
        
        // Removemos campos que não devem ser atualizados (PK e created_at)
        const { invoice_id, created_at, store_id, ...dataToUpdate } = data;

        await prisma.subscriptionInvoice.update({
            where: { invoice_id: invoice.id },
            data: {
                ...dataToUpdate
            }
        });
    }

    async findByGatewayId(gateway_id: string): Promise<SubscriptionInvoice | null> {
        const prismaData = await prisma.subscriptionInvoice.findFirst({
            where: { gateway_invoice_id: gateway_id }
        });

        if (!prismaData) return null;
        return PrismaSubscriptionInvoiceRepository.prismaToEntityMapper(prismaData);
        
    }

    async findPendingByStoreId(store_id: string): Promise<SubscriptionInvoice | null> {
        
        // --- INÍCIO DO DEBUG EXTREMO ---
        console.log("================ DEBUG DB ================");
        console.log("URL ATUAL DO BANCO:", process.env.MULTI_TENANT_DATABASE_URL);
        
        try {
            // Vamos fazer uma query bruta (Raw SQL) para perguntar ao PostgreSQL 
            // quais colunas ele REALMENTE tem nessa tabela agora.
            const columns = await prisma.$queryRaw`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'subscription_invoices';
            `;
            console.log("COLUNAS REAIS NO BANCO:", columns);
        } catch (err) {
            console.log("Erro na query bruta:", err);
        }
        console.log("==========================================");
        // --- FIM DO DEBUG EXTREMO ---


        const prismaData = await prisma.subscriptionInvoice.findFirst({
            where: { 
                store_id: store_id,
                status: PrismaInvoiceStatus.PENDING 
            }
        });

        if (!prismaData) return null;

        return PrismaSubscriptionInvoiceRepository.prismaToEntityMapper(prismaData);
    }
}

