import type { Sale } from '../../../entities/sale.js';
import type { ISaleRepository } from '../../sale.repository.interface.js';
import { prisma } from "../../../../../shared/infra/prisma.js";

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
}