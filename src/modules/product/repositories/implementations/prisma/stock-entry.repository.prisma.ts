import { Prisma, PrismaClient } from "@prisma/client";
import { StockEntry } from "../../../entities/stock-entry.js";
import type { IStockEntryRepository } from "../../interfaces/stock-entry.repository.interface.js";
import { prisma as globalPrisma } from "../../../../../shared/infra/prisma.js";
import { Decimal } from "decimal.js";

export class PrismaStockEntryRepository implements IStockEntryRepository {
    
    private db: PrismaClient | Prisma.TransactionClient;

    constructor(transactionClient?: Prisma.TransactionClient) {
        this.db = transactionClient ? transactionClient : globalPrisma;
    }

    private static prismaEntryToDomainMapper(prismaEntry: any): StockEntry {
        return StockEntry.restore({
            entry_id: prismaEntry.entry_id,
            product_id: prismaEntry.product_id,
            store_id: prismaEntry.store_id,
            quantity: prismaEntry.quantity,
            unit_cost: new Decimal(prismaEntry.unit_cost.toString()), 
            total_cost: new Decimal(prismaEntry.total_cost.toString()),
            created_at: prismaEntry.created_at.toISOString(),
            
            user_name: prismaEntry.user ? prismaEntry.user.username : 'Desconhecido',
            product_name: prismaEntry.product ? prismaEntry.product.name : 'Produto Removido',
            user_id: prismaEntry.user_id
        });
    }

    async save(stock_entry: StockEntry): Promise<void> {

        await this.db.stockEntry.create({
            data: {
                entry_id: stock_entry.id,
                quantity: stock_entry.quantity,
                unit_cost: stock_entry.unitCost.toNumber(),
                total_cost: stock_entry.totalCost.toNumber(),
                store_id: stock_entry.store_id,
                product_id: stock_entry.product_id,
                
                // Nota: Substitua pelo getter correto da sua entidade após ajustar as props
                user_id: (stock_entry as any).user_id 
            }
        });
    }

    async listStockEntries(
        store_id: string, 
        page: number, 
        items_per_page: number, 
        product_id?: string
    ): Promise<{ entries: StockEntry[]; total_count: number }> {
        
        const skip = (page - 1) * items_per_page;

        const whereClause = {
            store_id: store_id,
            ...(product_id && { product_id: product_id }) 
        };

        const [total_count, prismaEntries] = await Promise.all([
            this.db.stockEntry.count({ 
                where: whereClause 
            }),
            
            this.db.stockEntry.findMany({
                where: whereClause,
                skip: skip,
                take: items_per_page,
                orderBy: { created_at: 'desc' },
                include: {
                    product: { select: { name: true, gtin_code: true } },
                    user: { select: { username: true } }
                }
            })
        ]);

        const entries = prismaEntries.map(entry => 
            PrismaStockEntryRepository.prismaEntryToDomainMapper(entry)
        );

        return {
            entries,
            total_count
        };
    }
}