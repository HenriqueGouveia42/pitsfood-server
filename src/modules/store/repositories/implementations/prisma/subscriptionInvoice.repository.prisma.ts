import { SubscriptionInvoice, InvoiceStatus as EntityInvoiceStatus } from "../../../entities/subscriptionInvoice.js";
import { SubscriptionPlan as EntityPlan } from "../../../entities/store.js";
import type { ISubscriptionInvoiceRepository } from "../../interfaces/subscriptionInvoice.repository.interface.js"; 
import { prisma } from "../../../../../shared/infra/prisma.js";

import { InvoiceStatus as PrismaInvoiceStatus } from "../../../../../generated/prisma/client.js";
import { SubscriptionPlan as PrismaPlan } from "../../../../../generated/prisma/client.js";

export class PrismaSubscriptionInvoiceRepository implements ISubscriptionInvoiceRepository {

    // -------------------------------------------------------------------------
    // MAPPERS (Convertem do Banco para Entidade e vice-versa)
    // -------------------------------------------------------------------------

    private static prismaToEntityMapper(prismaInvoice: any): SubscriptionInvoice {
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
            due_date: prismaInvoice.due_date ? prismaInvoice.due_date.toISOString() : null,

            store_id: prismaInvoice.store_id,
            plan_tag: prismaInvoice.plan_tag as EntityPlan
        });
    }

    private static entityToPrismaMapper(invoice: SubscriptionInvoice): any {
        return {
            invoice_id: invoice.id,
            amount_in_cents: invoice.amount,
            currency: "BRL",
            status: invoice.status as PrismaInvoiceStatus,
            
            gateway_invoice_id: invoice.getProps.gateway_invoice_id, 
            pix_code: invoice.pixCode,
            payment_url: invoice.paymentUrl,

            created_at: new Date(invoice.createdAt),
            paid_at: invoice.paidAt ? new Date(invoice.paidAt) : null,
            due_date: invoice.dueDate ? new Date(invoice.dueDate) : null,

            store_id: invoice.storeId,
            plan_tag: invoice.planTag as PrismaPlan
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
}