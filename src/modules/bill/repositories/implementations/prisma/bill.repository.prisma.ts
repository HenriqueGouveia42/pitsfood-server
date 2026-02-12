import { Bill, billStates, type BillProps} from "../../../entities/bill.js"
import type { IBillRepository } from "../../bill.repository.interface.js";
import { PhysicalBill as EntityPhysicalBill } from "../../../entities/physicalBIllCard.js";
import type { PhysicalBillCard as PrismaPhysicalBill } from "../../../../../generated/prisma/client.js";
import { prisma } from "../../../../../shared/infra/prisma.js"
import { Decimal } from 'decimal.js';

export enum BillStatus{
    ABERTA = "ABERTA",
    FECHADA = "FECHADA",
    CANCELADA = "CANCELADA",
}

export class PrismaBillRepository implements IBillRepository {

    //mappers
    private static entityToPrismaDataMapper(bill: Bill): any{
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

    private static prismaToEntityDataMapper(prismaData: any): Bill{

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

    private static entityToPrismaPhysicalBillDataMapper(physical_bill: EntityPhysicalBill): PrismaPhysicalBill{
        return{
            id: physical_bill.id,
            code: physical_bill.code,
            store_id: physical_bill.store_id,
            is_lost: physical_bill.is_lost,
            created_at: new Date(physical_bill.createdAt),
            updated_at: new Date(physical_bill.updatedAt)
        }
    }

    private static prismaToEntityPhysicalBillDataMapper(prisma_physical_bill: PrismaPhysicalBill): EntityPhysicalBill{

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
    async findOpenBillByGtinCode(gtin_code: string, store_id: string): Promise<Bill | null> {

        const prismaBill = await prisma.bill.findFirst({
            where:{
                bill_code_gtin: gtin_code,
                store_id: store_id,
                status: billStates.ABERTA
            },
            include: {
                items: true 
            }
        })

        if(!prismaBill){
            return null
        }

        const entityBill: Bill = PrismaBillRepository.prismaToEntityDataMapper(prismaBill);

        return entityBill

    }

    async createOpenBill(bill: Bill, store_id: string): Promise<void> {

        const rawPrismaData = PrismaBillRepository.entityToPrismaDataMapper(bill);

        const { items, ...prismaData} = rawPrismaData;

        await prisma.$transaction(async (tx) =>{

            const alreadyOpennedBill = await tx.bill.findFirst({
                where:{
                    bill_code_gtin: bill.bill_code,
                    store_id: store_id,
                    status: BillStatus.ABERTA
                }
            })

            if(alreadyOpennedBill) throw new Error("Proibido criar novo uso de comanda pois esta comanda física ainda está aberta")
        
            await tx.bill.create({
                data: prismaData
            })

        })

       
    }

    async createBillBulk(bills: Bill[]): Promise<void> {

        const dataToInsert = bills.map(bill =>{
            const mapped = PrismaBillRepository.entityToPrismaDataMapper(bill);
            const { items, ...scalarData} = mapped;
            return scalarData;
        })

        await prisma.bill.createMany({
            data: dataToInsert
        })

    }

    async findBillById(bill_id: string): Promise<Bill> {

        const prismaBill = await prisma.bill.findUnique({
            where:{
                bill_id
            }
        })

        if (!prismaBill){
            throw new Error("Comanda nao encontrada");
        }

        const bill: Bill = PrismaBillRepository.prismaToEntityDataMapper(prismaBill);

        return bill;
    }

    async updateSavedBill(bill: Bill): Promise<void>{
        
        const rawMappedData = PrismaBillRepository.entityToPrismaDataMapper(bill);

        const {items, ...billHeaderdata } = rawMappedData;

        await prisma.$transaction(async (tx) =>{

            await tx.bill.update({
                where:{
                    bill_id: bill.bill_id
                },
                data: billHeaderdata
            })

            await tx.billProduct.deleteMany({
                where:{
                    bill_id: bill.bill_id
                }
            })

            if (items && items.length > 0){
                await tx.billProduct.createMany({
                    data: items
                })
            }

        })
    }


    async billWithThisGtinCodeExists(gtin_code: string, store_id: string){

        const billExists = await prisma.bill.findFirst({
            where:{
                bill_code_gtin: gtin_code,
                store_id: store_id
            }
        })

        if (!billExists){
            return false
        } else{
            return true
        }
    }


    async findManyOpenBillsByGtinCodes(bill_code_gtins: string[]){

        const prismaBills = await prisma.bill.findMany({
            where:{
                bill_code_gtin:{
                    in: bill_code_gtins
                },
                status: BillStatus.ABERTA
            },
            include: {
                items: true
            }
        })

        const entityBills: Bill[] = prismaBills.map(item => PrismaBillRepository.prismaToEntityDataMapper(item));

        return entityBills;
    }

    async closeManyBillsByGtinsCodes(bill_code_gtins: string[]): Promise<Bill[]>{

        const manyBillsUpdated = await prisma.bill.updateMany({
            where:{
                bill_code_gtin:{
                    in: bill_code_gtins
                },
                status: BillStatus.ABERTA
            },
            data:{
                status: BillStatus.FECHADA,
                updated_at: new Date().toISOString()
            }
        })

        const prismaBills = await prisma.bill.findMany({
            where:{
                bill_code_gtin:{
                    in: bill_code_gtins
                },
                status: BillStatus.FECHADA
            },
            include:{
                items: true
            }
        });

        const billEntities: Bill[] = prismaBills.map(b => PrismaBillRepository.prismaToEntityDataMapper(b));

        return billEntities;

    }

    async findAllOpenBills(): Promise<Bill[]>{

        const prismaOpenBills = await prisma.bill.findMany({
            where:{
                status: billStates.ABERTA
            },
            include:{
                items: true
            }
        })

        return prismaOpenBills.map(bill => 
            PrismaBillRepository.prismaToEntityDataMapper(bill)
        );
    }



    listSavedBills(): Promise<Bill[]> {
        throw new Error("Method not implemented.");
    }
    
    async getPhysicalBills(store_id: string): Promise<EntityPhysicalBill[] | null>{

        const prismaPhysicalBills: PrismaPhysicalBill[] = await prisma.physicalBillCard.findMany({
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


}