import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { User } from "../../../user/entities/user.js";
import { Store } from "../../entities/store.js";
import { AppError } from "../../../../shared/errors/AppError.js";

interface IGetStoreDataUseCaseRequest {
    store_id: string,
    user_id: string
}

export interface IGetStoreDataUseCaseResponse {
    store_name: string,
    owner_name: string
}

export class GetStoreDataUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,    
        private cacheProvider: ICacheProvider
    ) {}

    async execute({ store_id, user_id }: IGetStoreDataUseCaseRequest): Promise<IGetStoreDataUseCaseResponse> {

        if (store_id !== undefined && store_id !== null){

            const cacheKey = `store-summary-data:${store_id}`;

            const cachedData = await this.cacheProvider.get(cacheKey);

            if (cachedData) return JSON.parse(cachedData) as IGetStoreDataUseCaseResponse;

            // ---------------------------------------------------------
            //CACHE MISS - precisa buscar no Banco
            // ---------------------------------------------------------

            const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
            if (!store) throw new AppError("Loja não encontrada", 404, "STORE_NOT_FOUND");
    

            const owner: User | null = await this.userRepository.findSavedUserById(store.ownerId);
            if (!owner) throw new AppError("Proprietário da loja não encontrado", 404, "OWNER_NOT_FOUND");

            if (owner.id != store.ownerId) throw new AppError("Proprietario nao é dessa loja", 403, "STORE_MISMATCH");

            //monta o Objeto de Resposta
            const response: IGetStoreDataUseCaseResponse = {
                store_name: store.name,
                owner_name: owner.username // Pegamos o username da entidade User
            };

            //salva no cache para as próximas requisições
            //salvamos o objeto inteiro como string. TTL de 24h (86400s)
            await this.cacheProvider.save(
                cacheKey,
                JSON.stringify(response),
                86400 
            );

            return response;
        }

        const owner: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!owner) throw new AppError("Usuario gestor inexistente, algo muito estranho aconteceu", 404, "USER_NOT_FOUND");

        const response: IGetStoreDataUseCaseResponse = {
            store_name: "NOME DO SEU NEGÓCIO",
            owner_name: owner.username
        }

        return response

    }

        
}