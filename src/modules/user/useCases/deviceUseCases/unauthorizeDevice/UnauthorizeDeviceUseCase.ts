import { AppError } from "../../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../../../store/repositories/interfaces/store.repository.interface.js";
import { User, UserRole } from "../../../entities/user.js";
import type { IUserRepository } from "../../../repositories/interfaces/user.repository.interface.js";
import { Store } from "../../../../store/entities/store.js";
import { CacheKeys } from "../../../../../shared/constants/cache-keys.js";
import type { ICacheProvider } from "../../../../../shared/providers/CacheProvider/models/ICacheProvider.js";

export interface inputDTO{
    user_id_trying_unauthorize_device: string,
    user_id_target: string,
    device_id: string,
    store_id: string
}

export class UnauthorizeDeviceUseCase{

    constructor(
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository,
        private cacheProvider: ICacheProvider
    )
    {}

    /*
        3.
            3.1. Garantir que, se o usuário que está tentando desautorizar o dispositivo for usuário pago, ele deve ser o dono da loja E ser GESTOR
            3.2. Garantir que se o usuário alvo for dono de loja, somente ele mesmo pode desautorizar o pŕoprio dispositivo
            3.3. Garantir que os dois usuários estão vinculados a mesma loja
                3.3.1. Usuário autor é DONO da loja
                3.3.1. Usuário autor NÃO É DONO da loja

    */

    
    async execute( input: inputDTO): Promise<void>{

        const user_trying_unauthorize_device: User | null = await this.userRepository.findSavedUserById(input.user_id_trying_unauthorize_device);
        if(!user_trying_unauthorize_device) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        
        const target_user: User | null = await this.userRepository.findSavedUserById(input.user_id_target);
        if(!target_user) throw new AppError("Usuario alvo nao encontreado", 404, "USER_NOT_FOUND");

        const store: Store | null = await this.storeRepository.findSavedStoreById(input.store_id);
        if(!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");

        // Garantir que o usuario autor pertence a loja em questão
        if(user_trying_unauthorize_device.paying_user){
            if(store.ownerId !== user_trying_unauthorize_device.id){
                throw new AppError("Usuario autor não pertence a essa loja", 403, "STORE_MISMATCH");
            }
        } else {
            if(user_trying_unauthorize_device.storeId !== store.id){
                throw new AppError("Usuario autor não pertence a essa loja", 403, "STORE_MISMATCH");
            }
        }

        // Garantir que o usuario alvo pertence a loja em questão
        if(target_user.paying_user){
            if(store.ownerId !== target_user.id){
                throw new AppError("Usuario alvo nao pertence a essa loja", 403, "STORE_MISMATCH");
            }
        } else {
            if(target_user.storeId !== store.id){
                throw new AppError("Usuario alvo nao pertence a essa loja", 403, "STORE_MISMATCH");
            }
        }

        // Uma vez que garantimos que os DOIS usuarios pertencem a mesma STORE, vamos prosseguir para as validacções de 'role' e etc
        if(user_trying_unauthorize_device.role !== UserRole.GESTOR) throw new AppError("Usuario precisa ser GESTOR", 403, "UNAUTHORIZED_ROLE");

        if(
            user_trying_unauthorize_device.paying_user &&
            target_user.paying_user &&

            user_trying_unauthorize_device.id !== target_user.id
        ){
            throw new AppError("Erro grave de consistencia, uma loja nao pode ter dois donos", 500, "USER_STORE_MISMATCH");

        }

        if(
            !user_trying_unauthorize_device.paying_user &&
            target_user.paying_user
        ){
            throw new AppError("Somente o proprio dono pode desativar seu proprio dispositivo");

        }

        const updated_target_user: User = target_user.removeAuthorizedDeviceId(input.device_id);
        await this.userRepository.removeAuthorizedDevice(updated_target_user.id, input.device_id);

        const cache_key_authorized_devices: string = CacheKeys.User.AUTHORIZED_DEVICES_IDS(target_user.id);
        await this.cacheProvider.invalidate(cache_key_authorized_devices);

        const cache_key_user_data: string = CacheKeys.User.USERS_DATA(store.id);
        await this.cacheProvider.invalidate(cache_key_user_data);

    }
}