
import { Prisma, PrismaClient } from "../../../../../generated/prisma/client.js";
import { PhysicalBill } from "../../../entities/physicalBIllCard.js";
import type { PhysicalBillCard as PrismaPhysicalBillCard } from "../../../../../generated/prisma/client.js";
import type { IPhysicalBillRepository } from "../../interfaces/physicalBill.repository.interface.js";

import { prisma as globalPrisma } from "../../../../../shared/infra/prisma.js"; 

export class PrismaPhysicalBillRepository implements IPhysicalBillRepository {

    private db: PrismaClient | Prisma.TransactionClient;

    constructor(transactionClient?: Prisma.TransactionClient) {
        this.db = transactionClient ? transactionClient : globalPrisma;
    }

    private static prismaToEntityDataMapper(prismaBill: PrismaPhysicalBillCard): PhysicalBill {
        return PhysicalBill.restore({
            id: prismaBill.id,
            code: prismaBill.code,
            store_id: prismaBill.store_id,
            is_lost: prismaBill.is_lost,
            created_at: prismaBill.created_at.toISOString(),
            updated_at: prismaBill.updated_at.toISOString()
        });
    }

    private static entityToPrismaDataMapper(bill: PhysicalBill): PrismaPhysicalBillCard {
        return {
            id: bill.id,
            code: bill.code,
            store_id: bill.store_id,
            is_lost: bill.is_lost,
            created_at: new Date(bill.createdAt),
            updated_at: new Date(bill.updatedAt)
        };
    }
   
    async saveMany(physicalBills: Set<PhysicalBill>): Promise<void> {
        if (physicalBills.size === 0) return;

        const prismaBillsData = Array.from(physicalBills).map((bill) => 
            PrismaPhysicalBillRepository.entityToPrismaDataMapper(bill)
        );

        await this.db.physicalBillCard.createMany({
            data: prismaBillsData,
            skipDuplicates: true 
        });
    }

    async findByStoreId(store_id: string): Promise<PhysicalBill[]> {
        
        const prismaBills = await this.db.physicalBillCard.findMany({
            where: {
                store_id
            }
        });

        return prismaBills.map(bill => 
            PrismaPhysicalBillRepository.prismaToEntityDataMapper(bill)
        );
    }

    async existsByCode(code: string, store_id: string): Promise<boolean> {
        
        const prismaBill = await this.db.physicalBillCard.findUnique({
            where: {
                store_id_code: {
                    store_id,
                    code
                }
            }
        });

        return prismaBill !== null;
    }

    async update(physicalBill: PhysicalBill): Promise<void> {
        const prismaData = PrismaPhysicalBillRepository.entityToPrismaDataMapper(physicalBill);
        
        const { created_at, ...dataToUpdate } = prismaData;

        await this.db.physicalBillCard.update({
            where: { 
                id: prismaData.id 
            },
            data: dataToUpdate
        });
    }
}