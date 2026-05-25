import { prisma as globalPrisma } from "../../../../../shared/infra/prisma.js";
import type { Prisma, PrismaClient } from "../../../../../generated/prisma/client.js";

import type { Affiliate } from "../../../entities/affiliate.js";
import type { IAffiliateRepository } from "../../interfaces/affiliate.repository.interface.js";

export class PrismaAffiliateRepository implements IAffiliateRepository{

    private db: PrismaClient | Prisma.TransactionClient;

    constructor(transactionClient?: Prisma.TransactionClient){
        this.db = transactionClient ? transactionClient : globalPrisma
    }

    async getAffiliateById(id: string): Promise<Affiliate | null> {
        throw Error("Not implemented")
    }
}