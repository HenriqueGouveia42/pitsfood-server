import { AppError } from "../../../../shared/errors/AppError.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import type { Store, StoreProps } from "../../entities/store.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";

type RequestDTO = {
    store_id: string,
    new_name: string
}

export class UpdateStoreDataUseCase{
    constructor(
        private storeRepository: IStoreRepository,
        private cacheProvider: ICacheProvider
    ){}

    public async execute({ store_id, new_name }: RequestDTO){

        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError(`Loja com id: ${store_id} nao encontrada`, 404, "STORE_NOT_FOUND");

        const store_with_updated_name: Store = store.rename(new_name);

        await this.cacheProvider.invalidate(`store-summary-data:${store_id}`)

        await this.storeRepository.updateSavedStore(store_with_updated_name);

    }
}
