import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import { SubscriptionPlan, SubscriptionStatus } from "../../entities/store.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { Store } from "../../entities/store.js";

type useCaseRequestDTO = {
    store_id: string
}

export type useCaseResponseDTO = {
    plan: SubscriptionPlan,
    plan_status: SubscriptionStatus

}

export class GetPlanAndPlanStatusUseCase{

    constructor(
        private storeRepository: IStoreRepository
    ){}

    public async execute({ store_id }: useCaseRequestDTO): Promise<useCaseResponseDTO>{

        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("LOja nao encontrada", 404, "STORE_NOT_FOUND");

        const plan: SubscriptionPlan = store.plan;
        const plan_status: SubscriptionStatus = store.subscription_status;

        return{
            plan,
            plan_status
        }
    }
}