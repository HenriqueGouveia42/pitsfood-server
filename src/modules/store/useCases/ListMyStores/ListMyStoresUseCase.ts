import type { IStoreRepository } from "../../repositories/store.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { Store } from "../../entities/store.js";

type UseCaseRequestDTO = {
    user_id: string,
    is_paying_user: boolean
}

import { SubscriptionPlan, SubscriptionStatus} from "../../entities/store.js";

export type UseCaseResponseDTO = {
    stores:{
        store_id: string,
        store_name: string,
        store_is_active: boolean,
        store_subscription_plan: SubscriptionPlan
        store_subscription_plan_status: SubscriptionStatus

    }[]
}

export class ListMyStoresUseCase{
    constructor(
        private storeRepository: IStoreRepository
    ){}

    public async execute({ user_id, is_paying_user }: UseCaseRequestDTO): Promise<UseCaseResponseDTO> {

        if (!is_paying_user) throw new AppError("Usuario nao é um usuario pago dono de loja", 403, "USER_MUST_BE_OWNER");

        const stores: Store[] | null = await this.storeRepository.listAllSavedStores(user_id);

        return {
            stores: (stores || []).map(s => ({
                store_id: s.id,
                store_name: s.name,
                store_is_active: s.active,
                store_subscription_plan: s.plan,
                store_subscription_plan_status: s.subscription_status
            }))
        }
    }
}