// src/shared/infra/uow/uow.interface.ts

import type { IAffiliateRepository } from "../../../../modules/affiliate/repositories/interfaces/affiliate.repository.interface.js";
import type { IBillRepository } from "../../../../modules/bill/repositories/interfaces/bill.repository.interface.js";
import type { IProductRepository } from "../../../../modules/product/repositories/interfaces/product.repository.interface.js";
import type { ISaleRepository } from "../../../../modules/sale/repositories/interfaces/sale.repository.interface.js";
import type { IStagedUserRepository } from "../../../../modules/stagedUser/repositories/interfaces/staged_user.repository.interface.js";
import type { IStoreRepository } from "../../../../modules/store/repositories/interfaces/store.repository.interface.js";
import type { ISubscriptionInvoiceRepository } from "../../../../modules/store/repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { IUserRepository } from "../../../../modules/user/repositories/interfaces/user.repository.interface.js";
import type { IPhysicalBillRepository } from "../../../../modules/bill/repositories/interfaces/physicalBill.repository.interface.js";
import type { IStockEntryRepository } from "../../../../modules/product/repositories/interfaces/stock-entry.repository.interface.js";
import type { IPasswordResetRepository } from "../../../../modules/user/repositories/interfaces/password.reset.repository.interface.js";

/**
    Catálogo global de todos os repositórios do sistema capazes de rodar sob transação.
    Funciona como o mapa completo da infraestrutura de banco de dados.
*/
export interface ITransactionRepositories {
    afilliateRepository: IAffiliateRepository,
    billRepository: IBillRepository,
    productRepository: IProductRepository,
    saleRepository: ISaleRepository,
    stagedUserRepository: IStagedUserRepository,
    storeRepository: IStoreRepository;
    invoiceRepository: ISubscriptionInvoiceRepository;
    userRepository: IUserRepository,
    physicalBillRepository: IPhysicalBillRepository;
    stockEntryRepository: IStockEntryRepository;
    resetPasswordRepository: IPasswordResetRepository
}

/**
    Contrato principal do Unit of Work.
    Permite delimitar transações atômicas ocultando o framework de persistência (Prisma).
*/
export interface IUnitOfWork {
    
/** Abre uma transação isolada e executa o bloco de código fornecido.
    
    @template T O tipo do dado retornado pela lógica de negócio (ex: Store, void, etc).
    @template R Um subconjunto (fatia) de ITransactionRepositories exigido pelo Service específico.
    @param work O callback (closure) que contém as regras de negócio a serem executadas atomicamente.
    @returns O resultado processado pela função de negócio.
*/
    transaction<T, R extends Partial<ITransactionRepositories> = ITransactionRepositories>(
        work: (repositories: R) => Promise<T>
    ): Promise<T>;

}