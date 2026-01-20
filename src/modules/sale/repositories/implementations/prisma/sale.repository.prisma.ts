import type { Sale } from '../../../entities/sale.js';
import type { ISaleRepository } from '../../sale.repository.interface.js';
import { prisma } from "../../../../../shared/infra/prisma.js";
import { PaymentMethod } from '../../../entities/sale.js';
import { Decimal } from "decimal.js"
import type { SalesReportDTO } from "../../sale.repository.interface.js"
export class PrismaSaleRepository implements ISaleRepository {

    /**
     * Mapper Estático: entityToPrismaDataMapper
     * Responsável por converter a Entidade de Domínio (Sale) para o objeto de escrita do Prisma.
     * Estrutura o objeto para realizar "Nested Writes" (Salvar Venda, Itens e Pagamentos de uma vez).
     */
    private static entityToPrismaDataMapper(sale: Sale) {
        return {
            sale_id: sale.id,
            user_id: sale.userId,
            total_price: sale.total.toNumber(), // Decimal.js -> Number/Float
            status: sale.status,
            created_at: new Date(sale.createdAt),
            updated_at: new Date(sale.updatedAt),

            //mapeamento dos ITENS (Nested Write)
            items: { 
                create: sale.items.map(item => ({
                    sale_product_id: item.sale_product_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price_sold: item.unit_price_sold.toNumber(),
                    origin_bill_id: item.origin_bill_id ?? null 
                }))
            },

            //mapeamento dos PAGAMENTOS (Nested Write)
            payments: {
                create: sale.payments.map(pay => ({
                    sale_payment_id: pay.sale_payment_id,
                    amount: pay.amount.toNumber(),
                    method: pay.method
                }))
            }
        };
    }

    private static prismaToEntityMapper(prismaSale: any): Sale {
        return {
            id: prismaSale.sale_id,
            userId: prismaSale.user_id,
            total: new Decimal(prismaSale.total_price), // Reconstrói o Decimal
            status: prismaSale.status,
            createdAt: prismaSale.created_at,
            updatedAt: prismaSale.updated_at,
            
            items: prismaSale.items ? prismaSale.items.map((item: any) => ({
                sale_product_id: item.sale_product_id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price_sold: new Decimal(item.unit_price_sold),
                origin_bill_id: item.origin_bill_id
            })) : [],

            payments: prismaSale.payments ? prismaSale.payments.map((pay: any) => ({
                sale_payment_id: pay.sale_payment_id,
                amount: new Decimal(pay.amount),
                method: pay.method as PaymentMethod
            })) : []
        } as Sale;
    }


    async makeSale(sale: Sale): Promise<void> {
        
        const prismaData = PrismaSaleRepository.entityToPrismaDataMapper(sale);

        await prisma.sale.create({
            data: prismaData
        });
    }

    //salvar Venda + Fechar Comandas (Transação Atômica)
    async createSaleAndCloseBills(sale: Sale, billCodesToClose: string[]): Promise<void> {
        
        //prepara os dados antes de abrir a transação
        const prismaData = PrismaSaleRepository.entityToPrismaDataMapper(sale);

        await prisma.$transaction(async (tx) => {
            
            await tx.sale.create({
                data: prismaData
            });

            if (billCodesToClose.length > 0) {

                const updateResult = await tx.bill.updateMany({
                    where: {
                        bill_code_gtin: { in: billCodesToClose },
                        status: 'ABERTA'
                    },
                    data: {
                        status: 'FECHADA',
                        updated_at: new Date()
                    }
                });

                if (updateResult.count !== billCodesToClose.length) {
                    throw new Error(`Erro de Concorrência: Uma ou mais comandas foram alteradas por outro usuário durante o processo. Operação cancelada.`);
                }
            }
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
        const sales = await prisma.sale.findMany({
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

       
        return sales.map(sale => PrismaSaleRepository.prismaToEntityMapper(sale));    }

    async getSalesSummaryByPeriod(startDate: Date, endDate: Date): Promise<SalesReportDTO>{

        const generalMetrics = await prisma.sale.aggregate({
            _sum: {total_price: true},
            _count: { sale_id: true },
            where: {
                status: 'CONCLUIDA',
                created_at: { gte: startDate, lte: endDate }
            }
        });

        const totalRevenue = new Decimal(generalMetrics._sum.total_price || 0);
        const salesCount = generalMetrics._count.sale_id;
        const averageTicket = salesCount > 0 ? totalRevenue.div(salesCount).toNumber() : 0;

        const paymentsGrouped = await prisma.salePayment.groupBy({
            by: ['method'],
            _sum: { amount: true },
            where: {
                sale: {
                    status: 'CONCLUIDA',
                    created_at: { gte: startDate, lte: endDate }
                }
            }
        });

        const paymentBreakdown = paymentsGrouped.map(p => ({
            method: p.method as PaymentMethod,
            total: new Decimal(p._sum.amount || 0)
        }));

        const productsRaw = await prisma.$queryRaw<any[]>`
            SELECT
                p.name as product_name,
                sp.product_id,
                SUM(sp.quantity)::int as quantity_sold,
                SUM(sp.quantity * sp.unit_price_sold) as total_sold
            
            FROM "sale_products" sp
            JOIN "sales" s ON sp.sale_id = s.sale_id
            JOIN "products" p ON sp.product_id = p.product_id
            WHERE s.status = 'CONCLUIDA'
            AND s.created_at >= ${startDate}
            AND s.created_at <= ${endDate}
            GROUP BY sp.product_id, p.name
            ORDER BY total_sold DESC
        `;

        const productBreakdown = productsRaw.map((p: any) => ({
            product_name: p.product_name,
            quantity_sold: Number(p.quantity_sold),
            total_sold: new Decimal(p.total_sold || 0)
        }));

        return {
            period: { start: startDate, end: endDate },
            metrics: {
                total_revenue: totalRevenue,
                sales_count: salesCount,
                average_ticket: Number(averageTicket.toFixed(2))
            },
            payment_breakdown: paymentBreakdown,
            product_breakdown: productBreakdown
        };

    }
    
}