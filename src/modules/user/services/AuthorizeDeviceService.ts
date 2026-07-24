import { AppError } from "../../../shared/errors/AppError.js";
import { CacheKeys } from "../../../shared/constants/cache-keys.js";
import type { ICacheProvider } from "../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import type { IUserRepository } from "../repositories/interfaces/user.repository.interface.js";
import type { IStoreRepository } from "../../store/repositories/interfaces/store.repository.interface.js";
import { User } from "../entities/user.js";

export class AuthorizeDeviceService {
    constructor(
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository,
        private cacheProvider: ICacheProvider
    ) {}

    async execute(user_id: string, device_id: string, device_name: string): Promise<User> {
        
        const now: Date = new Date();

        // 1. Busca e Validações Básicas
        const user: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!user) throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
        if (!user.active) throw new AppError("Usuário inativo. Contate o administrador.", 403, "USER_DISABLED");

        // 2. Validação de Domínio (Passa pelas regras da Entidade: limite de devices, etc.)
        const updated_user: User = user.addAuthorizedDeviceId(device_id, device_name, now);

        // 3. Persistência
        await this.userRepository.addAuthorizedDevice(user.id, device_id, device_name);

        // 4. Invalidação de Caches (Específicos do Dispositivo)
        const cache_key_auth_code: string = CacheKeys.User.TEMPORARY_AUTHORIZE_DEVICE_CODE(user.id, device_id);
        const cache_key_auth_devices: string = CacheKeys.User.AUTHORIZED_DEVICES_IDS(user.id);
        await this.cacheProvider.invalidate([cache_key_auth_code, cache_key_auth_devices]);

        // 5. Invalidação de Caches (Dados de Usuários da Loja - A lógica complexa isolada aqui!)
        let stores_ids: string[] = [];
        if (updated_user.paying_user) {
            const ids: string[] = await this.storeRepository.findAllStoresIdsOwnedByUserId(updated_user.id);
            stores_ids.push(...ids);
        } else {
            if (!updated_user.storeId) {
                throw new AppError("Inconsistência: usuário não pagante sem 'store_id'", 500, "INVALID_USER");
            }
            stores_ids.push(updated_user.storeId);
        }

        const storeUsersCacheKeys: string[] = stores_ids.map(store_id => 
            CacheKeys.User.USERS_DATA(store_id)
        );
        await this.cacheProvider.invalidate(storeUsersCacheKeys);

        return updated_user;
    }
}