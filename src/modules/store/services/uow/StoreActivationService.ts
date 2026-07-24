// src/modules/store/services/StoreActivationService.ts

import { AppError } from "../../../../shared/errors/AppError.js";
import type { IUnitOfWork, ITransactionRepositories } from "../../../../shared/infra/uow/interface/uow.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { PLAN_LIMITS } from "../../../../config/plans.config.js";
import { PhysicalBill } from "../../../bill/entities/physicalBIllCard.js";
import { generateValid4DigitsPhysicalCodes } from "../../../bill/functions/GenerateValidPhysicalBillCodes.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { Store } from "../../entities/store.js";
import { SubscriptionPlan } from "../../entities/store.enums.js";
import type { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";

// definimos exatamente quais repositórios esta transação precisa
type ActivationRepos = Pick<ITransactionRepositories, 
    "storeRepository" | "invoiceRepository" | "physicalBillRepository"
>;

export interface IActivateStoreRequest {
    storeId: string;
    plan: SubscriptionPlan;
    expirationDate: Date;
    invoiceToMarkAsPaid?: SubscriptionInvoice; // Opcional, permite ativação manual sem fatura
}

export class StoreActivationService {
    constructor(
        private uow: IUnitOfWork,
        private cacheProvider: ICacheProvider
    ) {}

    async execute({ storeId, plan, expirationDate, invoiceToMarkAsPaid }: IActivateStoreRequest): Promise<void> {
        
        await this.uow.transaction<void, ActivationRepos>(async (repositories) => {
            
            const store = await repositories.storeRepository.findSavedStoreById(storeId);
            if (!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");

            // atualização da entidade principal
            const activatedStore: Store = store.activatePlan(plan, expirationDate);
            await repositories.storeRepository.updateSavedStore(activatedStore);

            // atualização do status da fatura (se houver)
            if (invoiceToMarkAsPaid) {
                const paidInvoice: SubscriptionInvoice = invoiceToMarkAsPaid.markAsPaid(new Date().toISOString());
                await repositories.invoiceRepository.update(paidInvoice);
            }

            // bloco protegido: gerar comandas físicas estritamente para o primeiro ciclo
            const alreadyHasBills = await repositories.physicalBillRepository.hasPhysicalBills(storeId);
            
            if (!alreadyHasBills) {
                const physical_bills_quantity: number = PLAN_LIMITS[plan].limits.max_physical_bills;
                const codes: Set<string> = generateValid4DigitsPhysicalCodes(physical_bills_quantity);
                const physical_bills: Set<PhysicalBill> = PhysicalBill.buildManyPhysicallBills(codes, storeId);
                
                await repositories.physicalBillRepository.saveMany(physical_bills); 
            }
        });

        // efeitos colaterais (invalidação de cache) rodam por fora da transação
        const cache_key = CacheKeys.Store.SUBSCRIPTION_STATUS(storeId);
        await this.cacheProvider.invalidate(cache_key);
    }
}