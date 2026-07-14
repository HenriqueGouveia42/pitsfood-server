import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import type { ITokenProvider } from "../../../user/providers/interfaces/token.provider.interface.js";

import type { ILoginSucess } from "../../../user/useCases/login/LoginUseCase.js";

import { SubscriptionStatus } from "../../entities/store.enums.js";
import { Store } from "../../entities/store.js";
import { User, UserRole } from "../../../user/entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

type UseCaseRequestDTO = {
    user_id: string
    store_id_to_login: string,
    token_version: number,
    current_store_id: string | null | undefined
}

// Criando um tipo de retorno baseado em União Discriminada
export type LoginIntoStoreResult = 
    | { 
        status: "SUCCESS"; 
        data: ILoginSucess 
      }
    | { 
        status: "CONFLICT_ALREADY_LOGGED_IN"; 
        message: string 
      };

export class LoginIntoStoreUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private tokenProvider: ITokenProvider,
        private cacheProvider: ICacheProvider
    ){}

    public async execute({user_id, store_id_to_login, token_version, current_store_id}: UseCaseRequestDTO): Promise<LoginIntoStoreResult> {

        // Em vez de lançar um erro, retornamos um status indicando o conflito.
        // Isso avisa ao Controller que ele precisa intervir (limpar o token).
        if (current_store_id) {
            return {
                status: "CONFLICT_ALREADY_LOGGED_IN",
                message: "Estado de sessão inválido: o usuário já possui uma loja vinculada neste dispositivo."
            }
        } 

        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id_to_login);
        if (!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");
        if (!store.active) throw new AppError("Loja encontra-se desativada", 403, "STORE_DEACTIVATED");
        if (store.subscription_status === SubscriptionStatus.CANCELED) throw new AppError("A assinatura desta loja foi cancelada.", 403, "SUBSCRIPTION_CANCELED");

        const user: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        if (!user.paying_user) throw new AppError("Usuario nao é usuario pago", 403, "NOT_PAYING_USER"); 
        if (user.role != UserRole.GESTOR) throw new AppError("Usuario nao é gestor", 403, "INVALID_USER_ROLE");
        if (store.ownerId != user.id) throw new AppError("Essa loja nao pertence a esse usuario", 403, "STORE_MISMATCH");

        const cacheKey: string = CacheKeys.Store.SUBSCRIPTION_STATUS(store.id);
        await this.cacheProvider.save(
            cacheKey,
            store.subscription_status,
            86400
        );

        const token = this.tokenProvider.generateToken(
            user.id,
            user.role,
            store.id,
            user.mustChangePassword,
            token_version, 
            user.paying_user
        );

        return {
            status: "SUCCESS",
            data: {
                token,
                user: {
                    id: user.id,
                    store_id: store.id,
                    username: user.username,
                    role: user.role,
                    must_change_password: user.mustChangePassword,
                    is_paying_user: user.paying_user,
                    token_version: token_version
                }
            }
        };
    }
}