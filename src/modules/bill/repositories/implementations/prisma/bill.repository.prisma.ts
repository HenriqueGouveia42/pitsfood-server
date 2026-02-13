import { Bill as EntityBill, billStates, type BillProps} from "../../../entities/bill.js"
import type { Bill as PrismaBill } from "../../../../../generated/prisma/client.js";
import type { IBillRepository } from "../../bill.repository.interface.js";
import { PhysicalBill as EntityPhysicalBill } from "../../../entities/physicalBIllCard.js";
import type { PhysicalBillCard as PrismaPhysicalBillCard } from "../../../../../generated/prisma/client.js";
import { prisma } from "../../../../../shared/infra/prisma.js"
import { Decimal } from 'decimal.js';

export enum BillStatus{
    ABERTA = "ABERTA",
    FECHADA = "FECHADA",
    CANCELADA = "CANCELADA",
}

export class PrismaBillRepository implements IBillRepository {

    //mappers
    private static entityToPrismaDataMapper(bill: EntityBill): any{
        return{
            bill_id: bill.bill_id,
            bill_code_gtin: bill.bill_code,
            status: bill.status,
            created_at: bill.createdAt,
            updated_at: bill.updatedAt,
            items: bill.items.map(item => ({
                bill_item_id: item.bill_item_id,
                quantity: item.quantity,
                price_at_addition: item.price_at_addition,
                product_name: item.product_name,
                product_gtin_code: item.product_gtin_code,

                product_id: item.product_id,
                user_id: item.user_id,

                bill_id: bill.bill_id
            }))
        }
    }

    private static prismaToEntityDataMapper(prismaData: any): EntityBill{

        const bill: BillProps = {
            bill_id: prismaData.bill_id,
            bill_code_gtin: prismaData.bill_code_gtin,
            status: prismaData.status,
            store_id: prismaData.store_id,
            created_at: prismaData.created_at,
            updated_at: prismaData.updated_at,
            items: prismaData.items
                ? prismaData.items.map((item: any) =>({
                    bill_item_id: item.bill_item_id,
                    quantity: item.quantity,
                    user_id: item.user_id,
                    product_id: item.product_id,
                    price_at_addition: new Decimal(item.price_at_addition),
                    bill_id: item.bill_id,
                    product_name: item.product_name,
                    product_gtin_code: item.product_gtin_code
                }))
                :   []      
        }

        return Bill.restoreBill(bill);

    }

    private static entityToPrismaPhysicalBillDataMapper(physical_bill: EntityPhysicalBill): PrismaPhysicalBillCard{
        return{
            id: physical_bill.id,
            code: physical_bill.code,
            store_id: physical_bill.store_id,
            is_lost: physical_bill.is_lost,
            created_at: new Date(physical_bill.createdAt),
            updated_at: new Date(physical_bill.updatedAt)
        }
    }

    private static prismaToEntityPhysicalBillDataMapper(prisma_physical_bill: PrismaPhysicalBillCard): EntityPhysicalBill{

        const entityPhysicalBill: EntityPhysicalBill = EntityPhysicalBill.restore({
            id: prisma_physical_bill.id,
            code: prisma_physical_bill.code,
            store_id: prisma_physical_bill.store_id,
            is_lost: prisma_physical_bill.is_lost,
            created_at: prisma_physical_bill.created_at.toISOString(),
            updated_at: prisma_physical_bill.updated_at.toISOString()
        })
          

        return entityPhysicalBill
    }


    

    //methods

    async getPhysicalBills(store_id: string): Promise<EntityPhysicalBill[] | null>{

        const prismaPhysicalBills: PrismaPhysicalBillCard[] = await prisma.physicalBillCard.findMany({
            where:{
                store_id: store_id
            }
        })

        if (prismaPhysicalBills.length == 0) return null

        const entitiesPhysicalBills: EntityPhysicalBill[] = prismaPhysicalBills.map(prisma_bill => (
            PrismaBillRepository.prismaToEntityPhysicalBillDataMapper(prisma_bill)
        ));

        return entitiesPhysicalBills;

    }

    async billWithThisGtinCodeExists(gtin_code: string, store_id: string){

        const billCard: PrismaPhysicalBillCard | null = await prisma.physicalBillCard.findUnique({
            where:{
                store_id_code:{
                    store_id: store_id,
                    code: gtin_code
                }
            }
        })

        if (billCard) return true

        return false
        
    }

    async getOpenBillByGtinCode(gtin_code: string, store_id: string): Promise<EntityBill[]>{

        const prismaBill: PrismaBill[] = await prisma.bill.findMany({
            where:{
                store_id,
                bill_code_gtin: gtin_code,
                status: BillStatus.ABERTA
            }
        })

        if (prismaBill.length == 0) return [];

        
        
    }

    
   
    


}