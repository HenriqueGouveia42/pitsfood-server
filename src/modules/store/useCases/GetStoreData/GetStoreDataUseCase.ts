import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { User } from "../../../user/entities/user.js";
import { Store } from "../../entities/store.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

interface IGetStoreDataUseCaseRequest {
    store_id: string,
    user_id: string
}

export interface IGetStoreDataUseCaseResponse {
    store_name: string,
    owner_name: string,
    store_icon_url: string | null
}

export class GetStoreDataUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,    
        private cacheProvider: ICacheProvider
    ) {}

    async execute({ store_id, user_id }: IGetStoreDataUseCaseRequest): Promise<IGetStoreDataUseCaseResponse> {

        if (store_id) { 

            //const cacheKey = `store-summary-data:${store_id}`;
            const cacheKey: string = CacheKeys.Store.SUMMARY(store_id); 

            
            const cachedData = await this.cacheProvider.get<IGetStoreDataUseCaseResponse>(cacheKey);

            if (cachedData) return cachedData;

            // ---------------------------------------------------------
            // CACHE MISS - precisa buscar no Banco
            // ---------------------------------------------------------

            const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
            if (!store) throw new AppError("Loja não encontrada", 404, "STORE_NOT_FOUND");
    
            const owner: User | null = await this.userRepository.findSavedUserById(store.ownerId);
            if (!owner) throw new AppError("Proprietário da loja não encontrado", 404, "OWNER_NOT_FOUND");

            if (owner.id != store.ownerId) throw new AppError("Proprietario nao é dessa loja", 403, "STORE_MISMATCH");

            const response: IGetStoreDataUseCaseResponse = {
                store_name: store.name,
                owner_name: owner.username,
                store_icon_url: store.store_icon_url ? store.store_icon_url : null
            };

            
            await this.cacheProvider.save(
                cacheKey,
                response, 
                86400 
            );

            return response;
        }

        const owner: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!owner) throw new AppError("Usuario gestor inexistente", 404, "USER_NOT_FOUND");

        return {
            store_name: "NOME DO SEU NEGÓCIO",
            owner_name: owner.username,
            store_icon_url: ""
        };
    }
}