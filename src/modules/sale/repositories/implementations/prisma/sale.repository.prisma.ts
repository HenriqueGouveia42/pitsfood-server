import { Prisma, PrismaClient } from '@prisma/client';
import { Sale } from '../../../entities/sale.js';
import type { ISaleRepository } from '../../interfaces/sale.repository.interface.js';
import { prisma as globalPrisma } from "../../../../../shared/infra/prisma.js";
import { Decimal } from "decimal.js"
import type { SalesReportDTO } from '../../interfaces/sale.repository.interface.js';

import type { Sale as PrismaSaleModel, SaleProduct as PrismaSaleProduct, SalePayment as PrismaSalePayment } from "@prisma/client";
import { SaleStatus, PaymentMethod, type SaleProp } from "../../../entities/sale.js";
import type { UserRole } from '../../../../user/entities/user.js';


type PrismaSaleWithRelations = PrismaSaleModel & {
    items?: PrismaSaleProduct[];
    payments?: PrismaSalePayment[];
};


export class PrismaSaleRepository implements ISaleRepository {

   
    private db: PrismaClient | Prisma.TransactionClient;

    constructor(transactionClient?: Prisma.TransactionClient){
        this.db = transactionClient ? transactionClient : globalPrisma
    }

    private static entityToPrismaSaleDataMapper(sale: Sale): Prisma.SaleCreateInput {
        return {
            sale_id: sale.id,
            total_price: sale.total.toNumber(),
            status: sale.status,

            seller_name: sale.sellerName,
            seller_role: sale.sellerRole,

            created_at: new Date(sale.createdAt),
            updated_at: new Date(sale.updatedAt),

            store: { connect: { store_id: sale.store_id } },
            
            user: { connect: { user_id: sale.userId } },

            items: { 
                createMany: {
                    data: sale.items.map(item => ({
                        sale_product_id: item.sale_product_id,
                        quantity: item.quantity,

                        unit_price_snapshot: item.unit_price_snapshot.toNumber(),
                        product_name_snapshot: item.product_name_snapshot,
                        product_gtin_snapshot: item.product_gtin_snapshot,
                        product_id: item.product_id,
                        origin_bill_id: item.origin_bill_id ?? null
                    }))
                }
            },

            // Mapeamento dos PAGAMENTOS
            payments: {
                createMany: {
                    data: sale.payments.map(pay => ({
                        sale_payment_id: pay.sale_payment_id,
                        amount: pay.amount.toNumber(),
                        method: pay.method
                        
                        // REMOVA O store_id AQUI TAMBÉM
                        // store_id: sale.store_id <--- APAGAR
                    }))
                }
            }
        };
    }

    private static prismaToEntitySaleDataMapper(prismaSale: PrismaSaleWithRelations): Sale {
        
        // Montamos o objeto de props respeitando estritamente a interface SaleProp
        const saleProps: SaleProp = {
            sale_id: prismaSale.sale_id,
            total_price: new Decimal(prismaSale.total_price.toString()), // Decimal seguro
            status: prismaSale.status as SaleStatus,
            
            created_at: prismaSale.created_at.toISOString(),
            updated_at: prismaSale.updated_at.toISOString(),
            
            store_id: prismaSale.store_id,
            user_id: prismaSale.user_id,

            seller_name: prismaSale.seller_name,
            seller_role: prismaSale.seller_role as UserRole,
            
            items: prismaSale.items ? prismaSale.items.map(item => ({
                sale_product_id: item.sale_product_id,
                quantity: item.quantity,
                
                // Os snapshots que garantem a imutabilidade do histórico
                unit_price_snapshot: new Decimal(item.unit_price_snapshot.toString()),
                product_name_snapshot: item.product_name_snapshot,
                product_gtin_snapshot: item.product_gtin_snapshot,
                
                store_id: item.store_id,
                sale_id: item.sale_id,
                product_id: item.product_id,
                ...(item.origin_bill_id !== null ? { origin_bill_id: item.origin_bill_id } : {origin_bill_id: null})
            })) : [],

            payments: prismaSale.payments ? prismaSale.payments.map(pay => ({
                sale_payment_id: pay.sale_payment_id,
                amount: new Decimal(pay.amount.toString()),
                method: pay.method as PaymentMethod,
                sale_id: pay.sale_id
            })) : []
        };

        //método de restauração da entidade para manter o encapsulamento
        return Sale.restore(saleProps);
    }


    async makeSale(sale: Sale): Promise<void> {
        
        const prismaData: Prisma.SaleCreateInput = PrismaSaleRepository.entityToPrismaSaleDataMapper(sale);

        await this.db.sale.create({
            data: prismaData
        });
    }

    findSavedSaleById(sale_id: string): Promise<Sale> {
        throw new Error("Method not implemented.");
    }
    listSavedSales(): Promise<Sale[]> {
        throw new Error("Method not implemented.");
    }
    deleteSavedSaleById(sale_id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async findByPeriod(startDate: Date, endDate: Date): Promise<Sale[]> {
        const sales = await this.db.sale.findMany({
            where: {
                created_at: { 
                    gte: startDate, // gte = greater than or equal (maior ou igual)
                    lte: endDate    // lte = less than or equal (menor ou igual)
                }
            },
            include: {
                items: true,    //traz os itens da venda
                payments: true  //traz os pagamentos
            },
            orderBy: {
                created_at: 'desc'
            }
        });

       
        return sales.map(sale => PrismaSaleRepository.prismaToEntitySaleDataMapper(sale));
    }

    async getSalesSummaryByPeriod(
        startDate: Date, 
        endDate: Date, 
        store_id: string, 
        timezone: string = 'America/Sao_Paulo'
    ): Promise<SalesReportDTO> {

        const start = new Date(startDate);
        const end = new Date(endDate);

        // 1. Métricas Gerais
        const generalMetrics = await this.db.sale.aggregate({
            _sum: {total_price: true},
            _count: { sale_id: true },
            where: {
                store_id: store_id,
                status: 'CONCLUIDA',
                created_at: { gte: start, lte: end } 
            }
        });

        // 2. Agrupamento por Pagamento (Sequencial, poupando conexões)
        // Removemos os ::timestamp manuais e deixamos o Prisma lidar com as Datas de forma nativa
        const paymentsRaw = await this.db.$queryRaw<any[]>`
            SELECT
                spm.method,
                SUM(spm.amount) as total_amount
            FROM "sale_payments" spm
            INNER JOIN "sales" s ON spm.sale_id = s.sale_id AND spm.store_id = s.store_id
            WHERE s.store_id = ${store_id}
            AND s.status = 'CONCLUIDA'
            AND s.created_at >= ${start}
            AND s.created_at <= ${end}
            GROUP BY spm.method
        `;

        // 3. Agrupamento por Produtos
        const productsRaw = await this.db.$queryRaw<any[]>`
            SELECT
                sp.product_name_snapshot as product_name,
                sp.product_id,
                SUM(sp.quantity)::int as quantity_sold,
                SUM(sp.quantity * sp.unit_price_snapshot) as total_sold 
            FROM "sale_products" sp
            INNER JOIN "sales" s ON sp.sale_id = s.sale_id AND sp.store_id = s.store_id
            WHERE s.store_id = ${store_id}
            AND s.status = 'CONCLUIDA'
            AND s.created_at >= ${start}
            AND s.created_at <= ${end}
            GROUP BY sp.product_id, sp.product_name_snapshot
            ORDER BY total_sold DESC
        `;

        // 4. Agrupamento por Hora do Dia
        // O timezone é convertido para string com ::text explicitamente para evitar falha no PG Parser
        const hourlyRaw = await this.db.$queryRaw<any[]>`
            SELECT
                EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE ${timezone}::text)::int as sale_hour,
                COUNT(sale_id)::int as sales_count,
                SUM(total_price) as total_sold
            FROM "sales"
            WHERE store_id = ${store_id}
            AND status = 'CONCLUIDA'
            AND created_at >= ${start}
            AND created_at <= ${end}
            GROUP BY sale_hour
            ORDER BY sale_hour ASC
        `;

        const totalRevenue = new Decimal(generalMetrics._sum.total_price || 0);
        const salesCount = generalMetrics._count.sale_id;
        const averageTicket = salesCount > 0 ? totalRevenue.div(salesCount).toNumber() : 0;

        const paymentBreakdown = paymentsRaw.map((p: any) => ({
            method: p.method as PaymentMethod,
            total: new Decimal(p.total_amount || 0)
        }));

        const productBreakdown = productsRaw.map((p: any) => ({
            product_name: p.product_name,
            quantity_sold: Number(p.quantity_sold),
            total_sold: new Decimal(p.total_sold || 0)
        }));

        const hourlyBreakdown = hourlyRaw.map((h: any) => ({
            hour: Number(h.sale_hour),
            sales_count: Number(h.sales_count),
            total_sold: new Decimal(h.total_sold || 0)
        }));

        return {
            period: { start: start, end: end },
            metrics: {
                total_revenue: totalRevenue,
                sales_count: salesCount,
                average_ticket: Number(averageTicket.toFixed(2))
            },
            payment_breakdown: paymentBreakdown,
            product_breakdown: productBreakdown,
            hourly_breakdown: hourlyBreakdown
        };
    }

    async findPaginatedSales(store_id: string, skip: number, limit: number): Promise<Sale[]>{
        
        // Busca apenas as vendas. Zero COUNTs.
        const prismaSales = await this.db.sale.findMany({
            where: { store_id: store_id },
            skip: skip,
            // TRUQUE DO N+1: Pedimos uma a mais do que o limite desejado
            take: limit + 1, 
            orderBy: {
                created_at: 'desc' 
            },
            include: {
                items: true,
                payments: true
            }
        });

        const entitySales = prismaSales.map(sale => PrismaSaleRepository.prismaToEntitySaleDataMapper(sale));

        return entitySales
    }
    
}