import { prisma } from "../../prisma.js";
import type { Prisma } from "../../../../generated/prisma/client.js";
import type { IUnitOfWork, ITransactionRepositories } from "../interface/uow.interface.js";

// Importações de todas as IMPLEMENTAÇÕES concretas do Prisma
import { PrismaAffiliateRepository } from "../../../../modules/affiliate/repositories/implementations/prisma/affiliate.repository.prisma.js";
import { PrismaBillRepository } from "../../../../modules/bill/repositories/implementations/prisma/bill.repository.prisma.js";
import { PrismaProductRepository } from "../../../../modules/product/repositories/implementations/prisma/product.repository.prisma.js";
import { PrismaSaleRepository } from "../../../../modules/sale/repositories/implementations/prisma/sale.repository.prisma.js";
import { PrismaStagedUserRepository } from "../../../../modules/stagedUser/repositories/implementations/prisma/staged_user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../../modules/store/repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaSubscriptionInvoiceRepository } from "../../../../modules/store/repositories/implementations/prisma/subscriptionInvoice.repository.prisma.js";
import { PrismaUserRepository } from "../../../../modules/user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaPhysicalBillRepository } from "../../../../modules/bill/repositories/implementations/prisma/physicallBill.repository.prisma.js";
import { PrismaStockEntryRepository } from "../../../../modules/product/repositories/implementations/prisma/stock-entry.repository.prisma.js";

export class PrismaUnitOfWork implements IUnitOfWork {
    
    async transaction<T, R extends Partial<ITransactionRepositories> = ITransactionRepositories>(
        work: (repositories: R) => Promise<T>
    ): Promise<T> {
        
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            
            // 1. Variáveis de cache para garantir que só instanciaremos 1 vez por transação)
            let afilliateRepo: PrismaAffiliateRepository;
            let billRepo: PrismaBillRepository;
            let productRepo: PrismaProductRepository;
            let saleRepo: PrismaSaleRepository;
            let stagedUserRepo: PrismaStagedUserRepository;
            let storeRepo: PrismaStoreRepository;
            let invoiceRepo: PrismaSubscriptionInvoiceRepository;
            let userRepo: PrismaUserRepository;
            let physicalBillRepo: PrismaPhysicalBillRepository;
            let stockEntryRepository: PrismaStockEntryRepository;

            // 2. Objeto Proxy (Lazy Loading) - Mapeia estritamente as chaves da interface ITransactionRepositories
            const lazyRepositories: ITransactionRepositories = {
                
                get afilliateRepository() {
                    if (!afilliateRepo) afilliateRepo = new PrismaAffiliateRepository(tx);
                    return afilliateRepo;
                },

                get billRepository() {
                    if (!billRepo) billRepo = new PrismaBillRepository(tx);
                    return billRepo;
                },

                get productRepository() {
                    if (!productRepo) productRepo = new PrismaProductRepository(tx);
                    return productRepo;
                },

                get saleRepository() {
                    if (!saleRepo) saleRepo = new PrismaSaleRepository(tx);
                    return saleRepo;
                },

                get stagedUserRepository() {
                    if (!stagedUserRepo) stagedUserRepo = new PrismaStagedUserRepository(tx);
                    return stagedUserRepo;
                },

                get storeRepository() {
                    if (!storeRepo) storeRepo = new PrismaStoreRepository(tx);
                    return storeRepo;
                },

                get invoiceRepository() {
                    if (!invoiceRepo) invoiceRepo = new PrismaSubscriptionInvoiceRepository(tx);
                    return invoiceRepo;
                },

                get userRepository() {
                    if (!userRepo) userRepo = new PrismaUserRepository(tx);
                    return userRepo;
                },

                get physicalBillRepository() {
                    if (!physicalBillRepo) physicalBillRepo = new PrismaPhysicalBillRepository(tx);
                    return physicalBillRepo;
                },

                get stockEntryRepository() {
                    if(!stockEntryRepository) stockEntryRepository = new PrismaStockEntryRepository(tx);
                    return stockEntryRepository
                }
            };

            // 3. Execução da Regra de Negócio injetando o Proxy tipado
            return await work(lazyRepositories as unknown as R);
            
        },
        {
            maxWait: 5000,  // Tempo máximo esperando conectar ao banco (5s)
            timeout: 10000  // Tempo máximo que a transação pode durar (10s) 
        }
    
    );
}
}