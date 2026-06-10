// src/modules/store/services/StoreActivationService.ts

import { AppError } from "../../../shared/errors/AppError.js";
import type { IUnitOfWork, ITransactionRepositories } from "../../../shared/infra/uow/interface/uow.interface.js";
import type { ICacheProvider } from "../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { PLAN_LIMITS } from "../../../config/plans.config.js";
import { PhysicalBill } from "../../bill/entities/physicalBIllCard.js";
import { generateValid4DigitsPhysicalCodes } from "../../bill/functions/GenerateValidPhysicalBillCodes.js";
import { CacheKeys } from "../../../shared/constants/cache-keys.js";
import type { Store } from "../entities/store.js";
import { SubscriptionPlan } from "../entities/store.enums.js";
import type { SubscriptionInvoice } from "../entities/subscriptionInvoice.js";

// Definimos exatamente quais repositórios esta transação precisa
type ActivationRepos = Pick<ITransactionRepositories, 
    "storeRepository" | "invoiceRepository" | "physicalBillRepository"
>;

export interface IActivateStoreRequest {
    storeId: string;
    plan: SubscriptionPlan;
    expirationDate: Date;
    invoiceToMarkAsPaid?: SubscriptionInvoice; // Opcional, permite ativação manual sem fatura!!
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

            const physical_bills_quantity: number= PLAN_LIMITS[plan].limits.max_physical_bills;
            const codes: Set<string> = generateValid4DigitsPhysicalCodes(physical_bills_quantity);

            const activatedStore: Store = store.activatePlan(plan, expirationDate);
            const physical_bills: Set<PhysicalBill> = PhysicalBill.buildManyPhysicallBills(codes, storeId);
            
            // Persistência Atômica usando os repositórios injetados pela transação
            // Ou tudo passa ou nada passa
            await repositories.storeRepository.updateSavedStore(activatedStore);

            if (invoiceToMarkAsPaid) {
                const paidInvoice: SubscriptionInvoice = invoiceToMarkAsPaid.markAsPaid(new Date().toISOString());
                await repositories.invoiceRepository.update(paidInvoice);
            }

            await repositories.physicalBillRepository.saveMany(physical_bills); 
        });

        // Efeitos colaterais que não pertencem ao banco de dados rodam por fora - CACHE
        const cache_key = CacheKeys.Store.SUBSCRIPTION_STATUS(storeId);
        await this.cacheProvider.invalidate(cache_key);
    }
}