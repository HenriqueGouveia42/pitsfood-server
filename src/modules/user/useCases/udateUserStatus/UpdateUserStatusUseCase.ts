import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { User, UserRole } from "../../entities/user.js"; 
import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import { SubscriptionPlan } from "../../../store/entities/store.enums.js";
import { PLAN_LIMITS } from "../../../../config/plans.config.js";

export interface IUpdateStatusRequest {
    target_user_id: string;
    modifier_user_id: string;
    modifier_user_store_id: string;
    active: boolean;
}

export class UpdateUserStatusUseCase {
    constructor(
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository,
        private cacheProvider: ICacheProvider
    ) {}

    async execute({ target_user_id, modifier_user_id, modifier_user_store_id, active }: IUpdateStatusRequest): Promise<void> {
        const user_target = await this.userRepository.findSavedUserById(target_user_id);
        if (!user_target) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        
        // Se o status já for o desejado, nem prossegue
        if (user_target.active === active) return;

        const userTryingToUpdate = await this.userRepository.findSavedUserById(modifier_user_id);
        if (!userTryingToUpdate) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        if (userTryingToUpdate.role !== UserRole.GESTOR) throw new AppError("USUARIO NAO É GESTOR", 403, "USER_MUST_BE_GESTOR");

        const store = await this.storeRepository.findSavedStoreById(modifier_user_store_id);
        if (!store) throw new AppError("Loja não encontrada", 404, "STORE_NOT_FOUND");
        if (store.ownerId !== userTryingToUpdate.id) throw new AppError("Usuario precisa ser dessa mesma loja", 404, "USER_MISMATCH");

        if (active === false && target_user_id === userTryingToUpdate.id) {
            throw new AppError("Dono da loja nao pode desativar a si mesmo", 403, "OWNER_CANNOT_DEACTIVATE_ITSELF");
        }

        if (active === true) {
            const store_plan: SubscriptionPlan = store.plan as SubscriptionPlan;
            const user_role: UserRole = user_target.role as UserRole;
            const max_quantity: number | undefined = PLAN_LIMITS[store_plan].limits.max_users[user_role];
            if (!max_quantity) throw new AppError("Numero maximo nao configurado");
            
            const all_users: User[] = await this.userRepository.listAllSavedUsers(store.id, true);
            const all_user_role = all_users.filter(u => u.role === user_role);

            if (all_user_role.length >= max_quantity) {
                throw new AppError(`Seu plano ${store_plan} só lhe permite ter até ${max_quantity} para o cargo ${user_role}`, 403, "MAX_ACTIVE_USER_REACHED");
            }
        }

        const updatedUser: User = user_target.withUpdatedData(user_target.username, user_target.passwordHash, active);

        if (active === false) {
            const newVersion = Date.now();
            await this.cacheProvider.save(
                CacheKeys.User.TOKEN_VERSION(target_user_id), 
                newVersion, 
                86400
            );
        }

        await this.cacheProvider.invalidate(CacheKeys.User.USERS_DATA(store.id));

        await this.userRepository.updateSavedUser(updatedUser);
    }
}