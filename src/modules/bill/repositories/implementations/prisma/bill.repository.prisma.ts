import { Bill, billStates, type BillProps} from "../../../entities/bill.js"
import type { IBillRepository } from "../../bill.repository.interface.js";
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
            created_at: prismaData.created_at,
            updated_at: prismaData.updated_at,
            items: prismaData.items
                ? prismaData.items.map((item: any) =>({
                    bill_item_id: item.bill_item_id,
                    user_id: item.user_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price_at_addition: new Decimal(item.price_at_addition),
                    bill_id: item.bill_id
                }))
                :   []      
        }
        return Bill.restoreBill(bill);

    }

    //methods
    async findOpenBillByGtinCode(gtin_code: string): Promise<Bill | null> {

        const prismaBill = await prisma.bill.findFirst({
            where:{
                bill_code_gtin: gtin_code,
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

    async createOpenBill(bill: Bill): Promise<void> {

        const rawPrismaData = PrismaBillRepository.entityToPrismaDataMapper(bill);

        const { items, ...prismaData} = rawPrismaData;

        await prisma.$transaction(async (tx) =>{

            const alreadyOpennedBill = await tx.bill.findFirst({
                where:{
                    bill_code_gtin: bill.bill_code,
                    status: BillStatus.ABERTA
                }
            })

            if(alreadyOpennedBill){
                throw new Error("Proibido criar novo uso de comanda pois esta comanda física ainda está aberta")
            }

            await tx.bill.create({
                data: prismaData
            })

        })

       
    }

    async createOpenBillBulk(bills: Bill[]): Promise<void> {

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


    async billWithThisGtinCodeExists(gtin_code: string){

        const billExists = await prisma.bill.findFirst({
            where:{
                bill_code_gtin: gtin_code
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


    listSavedBills(): Promise<Bill[]> {
        throw new Error("Method not implemented.");
    }
    
}