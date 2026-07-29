import { Prisma, PrismaClient } from "@prisma/client";
import { Bill as EntityBill, billStates, type BillProps } from "../../../entities/bill.js";
import type { Bill as PrismaBill } from "@prisma/client";
import type { BillProduct as PrismaBillProduct } from "@prisma/client";
import type { IBillRepository } from "../../interfaces/bill.repository.interface.js";
import { PhysicalBill as EntityPhysicalBill } from "../../../entities/physicalBIllCard.js";
import type { PhysicalBillCard as PrismaPhysicalBillCard } from "@prisma/client";
import { prisma as globalPrisma } from "../../../../../shared/infra/prisma.js";
import { Decimal } from 'decimal.js';

// Enum local para tipagem
export enum BillStatus {
    ABERTA = "ABERTA",
    FECHADA = "FECHADA",
    CANCELADA = "CANCELADA",
}

//tipo auxiliar para garantir que o mapper de leitura saiba que os itens podem vir
type PrismaBillWithItems = PrismaBill & { items?: PrismaBillProduct[] };

export class PrismaBillRepository implements IBillRepository {

    private db: PrismaClient | Prisma.TransactionClient;

    constructor(transactionClient?: Prisma.TransactionClient){
        this.db = transactionClient ? transactionClient : globalPrisma
    }

    private static entityToPrismaBillDataMapper(bill: EntityBill): Prisma.BillUncheckedCreateInput {
        return {
            bill_id: bill.bill_id,
            bill_code_gtin: bill.bill_code,
            status: bill.status,
            created_at: new Date(bill.createdAt),
            updated_at: new Date(bill.updatedAt),
            closed_at: bill.closed_at ? new Date(bill.closed_at) : null,
            
            store_id: bill.store_id,

            items: {
                create: bill.items.map(item => ({
                    bill_item_id: item.bill_item_id,
                    price_at_addition: item.price_at_addition.toNumber(),
                    product_name: item.product_name,
                    product_gtin_code: item.product_gtin_code,

                    store_id: bill.store_id,
                    product_id: item.product_id,
                    user_id: item.user_id,

                    created_at: new Date(item.created_at),
                    updated_at: new Date(item.updated_at ?? new Date())
                }))
            }
        };
    }

    
    private static prismaToEntityBillDataMapper(prismaData: PrismaBillWithItems): EntityBill {
        const billProps: BillProps = {
            bill_id: prismaData.bill_id,
            bill_code_gtin: prismaData.bill_code_gtin,
            status: prismaData.status as billStates,
            store_id: prismaData.store_id,
            created_at: prismaData.created_at.toISOString(),
            updated_at: prismaData.updated_at.toISOString(),
            closed_at: prismaData.created_at.toISOString(),

            items: prismaData.items
                ? prismaData.items.map((item: PrismaBillProduct) => ({
                    bill_item_id: item.bill_item_id,
                    user_id: item.user_id,
                    product_id: item.product_id,
                    bill_id: item.bill_id,
                    product_name: item.product_name,
                    product_gtin_code: item.product_gtin_code,
                    
                    price_at_addition: new Decimal(item.price_at_addition.toString()),
                    
                    store_id: item.store_id, 
                    
                    created_at: item.created_at.toISOString(),
                    updated_at: item.updated_at.toISOString() 
                }))
                : []
        };

        return EntityBill.restoreBill(billProps);
    }

    private static prismaToEntityPhysicalBillDataMapper(prisma_physical_bill: PrismaPhysicalBillCard): EntityPhysicalBill {
        return EntityPhysicalBill.restore({
            id: prisma_physical_bill.id,
            code: prisma_physical_bill.code,
            store_id: prisma_physical_bill.store_id,
            is_lost: prisma_physical_bill.is_lost,
            created_at: prisma_physical_bill.created_at.toISOString(),
            updated_at: prisma_physical_bill.updated_at.toISOString(),
        });
    }

    private static entityToPrismaPhysicalBillDataMapper(entity_physical_bill: EntityPhysicalBill): Prisma.PhysicalBillCardCreateManyInput {
        return {
            id: entity_physical_bill.id,
            code: entity_physical_bill.code,
            store_id: entity_physical_bill.store_id,
            is_lost: entity_physical_bill.is_lost,
            created_at: new Date(entity_physical_bill.createdAt),
            updated_at: new Date(entity_physical_bill.updatedAt)
        };
    }

    async getPhysicalBills(store_id: string): Promise<EntityPhysicalBill[] | null> {
        const prismaPhysicalBills: PrismaPhysicalBillCard[] = await this.db.physicalBillCard.findMany({
            where: {
                store_id: store_id
            }
        });

        if (prismaPhysicalBills.length === 0) return null;

        return prismaPhysicalBills.map(prisma_bill => (
            PrismaBillRepository.prismaToEntityPhysicalBillDataMapper(prisma_bill)
        ));
    }

    async physicalBillWithThisGtinCodeExists(gtin_code: string, store_id: string): Promise<boolean> {
        const billCard: PrismaPhysicalBillCard | null = await this.db.physicalBillCard.findUnique({
            where: {
                store_id_code: {
                    store_id: store_id,
                    code: gtin_code
                }
            }
        });

        return !!billCard;
    }

    async getOpenBillByCode(gtin_code: string, store_id: string): Promise<EntityBill | null> {

        const prismaBill: PrismaBillWithItems | null = await this.db.bill.findFirst({
            where: {
                store_id: store_id,
                bill_code_gtin: gtin_code,
                status: BillStatus.ABERTA
            },
            include: {
                items: true
            }
        });

        if (!prismaBill) return null;

        return PrismaBillRepository.prismaToEntityBillDataMapper(prismaBill);
    }

    async upsertBill(bill: EntityBill): Promise<void> {
        
        // Prepara os dados dos ITENS
        const itemsData = bill.items.map(item => ({
            bill_item_id: item.bill_item_id,
            price_at_addition: item.price_at_addition.toNumber(),
            product_name: item.product_name,
            product_gtin_code: item.product_gtin_code,
            store_id: bill.store_id,
            product_id: item.product_id,
            user_id: item.user_id,
            created_at: new Date(item.created_at),
            updated_at: new Date(item.updated_at ?? new Date()),
            bill_id: bill.bill_id
        }));

        // 1. Atualiza ou cria a Comanda
        await this.db.bill.upsert({
            where: {
                store_id_bill_id: {
                    store_id: bill.store_id,
                    bill_id: bill.bill_id
                }
            },
            create: {
                bill_id: bill.bill_id,
                bill_code_gtin: bill.bill_code,
                status: bill.status,
                created_at: new Date(bill.createdAt),
                updated_at: new Date(bill.updatedAt),
                store: { connect: { store_id: bill.store_id } }
            },
            update: {
                status: bill.status,
                updated_at: new Date()
            }
        });

        // 2. Insere os Itens sequencialmente
        if (itemsData.length > 0) {
            await this.db.billProduct.createMany({
                data: itemsData,
                skipDuplicates: true // ignora itens que já existem
            });
        }
    }

    async findAllOpenBills(store_id: string): Promise<EntityBill[]> {

        const prismaOpenBills: PrismaBillWithItems[] = await this.db.bill.findMany({
            where: {
                store_id: store_id,
                status: BillStatus.ABERTA
            },
            include: {
                items: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        if (prismaOpenBills.length === 0) {
            return [];
        }

        const entityBills: EntityBill[] = prismaOpenBills.map(prismaBill => 
            PrismaBillRepository.prismaToEntityBillDataMapper(prismaBill)
        );

        return entityBills;
    }

    async closeBills(store_id: string, bill_codes: string[], now: Date): Promise<void> {
        
        if(bill_codes.length === 0) return;

        const updateResult = await this.db.bill.updateMany({
            where:{
                store_id: store_id,
                bill_code_gtin: { in: bill_codes },
                status: 'ABERTA'
            },
            data: {
                status: 'FECHADA',
                updated_at: now,
                closed_at: now
            }
        })

        if (updateResult.count !== bill_codes.length){
            throw new Error(`Erro de Concorrência: Uma ou mais comandas foram alteradas por outro usuário durante o processo.`);        
        }
    }

    async getManyOpenBillsByCodes(codes: string[], store_id: string): Promise<EntityBill[]> {
        

        if(codes.length === 0) return [];

        const prismaBills: PrismaBillWithItems[] = await this.db.bill.findMany({
            where:{
                store_id: store_id,
                bill_code_gtin: { in: codes },
                status: BillStatus.ABERTA
            },
            include: {
                items: true
            }
        })

        return prismaBills.map(prismaBill => 
            PrismaBillRepository.prismaToEntityBillDataMapper(prismaBill)
        )
    }

}