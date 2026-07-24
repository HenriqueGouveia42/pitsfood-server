// UpdateUserNameUseCase.ts
import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { User, UserRole } from "../../entities/user.js"; 
import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

export interface IUpdateNameRequest {
    target_user_id: string;
    modifier_user_id: string;
    modifier_user_store_id: string;
    name: string;
}

export class UpdateUserNameUseCase {
    constructor(
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository,
        private cacheProvider: ICacheProvider
    ) {}

    async execute({ target_user_id, modifier_user_id, modifier_user_store_id, name }: IUpdateNameRequest): Promise<void> {
        const user_target = await this.userRepository.findSavedUserById(target_user_id);
        if (!user_target) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        const userTryingToUpdate = await this.userRepository.findSavedUserById(modifier_user_id);
        if (!userTryingToUpdate) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        if (userTryingToUpdate.role !== UserRole.GESTOR) throw new AppError("USUARIO NAO É GESTOR", 403, "USER_MUST_BE_GESTOR");

        const store = await this.storeRepository.findSavedStoreById(modifier_user_store_id);
        if (!store) throw new AppError("Loja não encontrada", 404, "STORE_NOT_FOUND");
        if (store.ownerId !== userTryingToUpdate.id) throw new AppError("Usuario precisa ser dessa mesma loja", 404, "USER_MISMATCH");

        if (userTryingToUpdate.id !== store.ownerId && user_target.id === store.ownerId) {
            throw new AppError("Voce nao pode alterar o nome do gestor dono", 403, "YOU_HAVE_NO_POWER");
        }

        const updatedUser = user_target.withUpdatedData(name, user_target.passwordHash, user_target.active);
        
        const cachePromises: Promise<void>[] = [
            this.cacheProvider.invalidate(CacheKeys.User.USERS_DATA(store.id))
        ];

        if (user_target.id === store.ownerId) {
            cachePromises.push(this.cacheProvider.invalidate(CacheKeys.Store.SUMMARY(modifier_user_store_id)));
        }

        await Promise.all([
            this.userRepository.updateSavedUser(updatedUser),
            ...cachePromises
        ]);
    }
}