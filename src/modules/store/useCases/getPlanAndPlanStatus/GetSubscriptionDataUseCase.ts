import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import { SubscriptionPlan, SubscriptionStatus } from "../../entities/store.enums.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { Store } from "../../entities/store.js";

type useCaseRequestDTO = {
    store_id: string
}

export type useCaseResponseDTO = {
    plan: SubscriptionPlan,
    plan_status: SubscriptionStatus,
    expires_at: Date | null
}

export class GetSubscriptionDataUseCase{

    constructor(
        private storeRepository: IStoreRepository
    ){}

    public async execute({ store_id }: useCaseRequestDTO): Promise<useCaseResponseDTO>{

        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("LOja nao encontrada", 404, "STORE_NOT_FOUND");

        const plan: SubscriptionPlan = store.plan;
        const plan_status: SubscriptionStatus = store.subscription_status;
        const expires_at: Date | null = store.subscription_expires_at ? new Date(store.subscription_expires_at) : null

        return{
            plan,
            plan_status,
            expires_at
        }
    }
}