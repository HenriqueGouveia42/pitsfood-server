import { Prisma } from "../../../../../generated/prisma/client.js";
import { Bill as EntityBill, billStates, type BillProps } from "../../../entities/bill.js";
import type { Bill as PrismaBill } from "../../../../../generated/prisma/client.js";
import type { BillProduct as PrismaBillProduct } from "../../../../../generated/prisma/client.js";
import type { IBillRepository } from "../../bill.repository.interface.js";
import { PhysicalBill as EntityPhysicalBill } from "../../../entities/physicalBIllCard.js";
import type { PhysicalBillCard as PrismaPhysicalBillCard } from "../../../../../generated/prisma/client.js";
import { prisma } from "../../../../../shared/infra/prisma.js";
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

    private static entityToPrismaBillDataMapper(bill: EntityBill): Prisma.BillUncheckedCreateInput {
        return {
            bill_id: bill.bill_id,
            bill_code_gtin: bill.bill_code,
            status: bill.status,
            created_at: new Date(bill.createdAt),
            updated_at: new Date(bill.updatedAt),
            
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
            updated_at: prisma_physical_bill.updated_at.toISOString()
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
        const prismaPhysicalBills: PrismaPhysicalBillCard[] = await prisma.physicalBillCard.findMany({
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
        const billCard: PrismaPhysicalBillCard | null = await prisma.physicalBillCard.findUnique({
            where: {
                store_id_code: {
                    store_id: store_id,
                    code: gtin_code
                }
            }
        });

        return !!billCard;
    }

    async getOpenBillByGtinCode(gtin_code: string, store_id: string): Promise<EntityBill[]> {

        const prismaBills: PrismaBillWithItems[] = await prisma.bill.findMany({
            where: {
                store_id,
                bill_code_gtin: gtin_code,
                status: BillStatus.ABERTA
            },
            include: {
                items: true
            }
        });

        if (prismaBills.length == 0) return []

        const entitieBills: EntityBill[] = prismaBills.map(b => (
            PrismaBillRepository.prismaToEntityBillDataMapper(b)
        ));

        return entitieBills;
    }

    async upsertBill(bill: EntityBill): Promise<void> {
        
        //prepara os dados dos ITENS
        //mapeamos para o formato exato que a tabela bill_products espera
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

   
        await prisma.$transaction(async (tx) => {
            
            //garante que a Comanda (Bill) existe ou cria ela (SEM ITENS)
            await tx.bill.upsert({
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

            // insere os Itens (Bulk Insert)
            if (itemsData.length > 0) {
                await tx.billProduct.createMany({
                    data: itemsData,
                    skipDuplicates: true //ignora itens que já existem
                });
            }
        });
    }

    async findAllOpenBills(store_id: string): Promise<EntityBill[]> {

        const prismaOpenBills: PrismaBillWithItems[] = await prisma.bill.findMany({
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

}