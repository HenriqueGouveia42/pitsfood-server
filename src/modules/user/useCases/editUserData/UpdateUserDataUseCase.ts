import { hash } from "bcryptjs"; 
import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { User } from "../../entities/user.js";
import { UserRole } from "../../entities/user.js"; 
import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";
import { Store } from "../../../store/entities/store.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import { SubscriptionPlan } from "../../../store/entities/store.js";
import { PLAN_LIMITS } from "../../../../config/plans.config.js";
import { string } from "zod";

export interface IRequestUseCase {
    target_user_id: string;
    modifier_user_id: string
    modifier_user_store_id: string,
    name?: string | undefined,
    password?: string | undefined,
    active?: boolean | undefined,
}

export class UpdateUserDataUseCase {

    constructor(
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository,
        private cacheProvider: ICacheProvider
    ) {}

    async execute({ 
        target_user_id,
        modifier_user_id,
        modifier_user_store_id,
        name,
        password, 
        active, 
    }: IRequestUseCase): Promise<void> {
        
        const user_target: User | null = await this.userRepository.findSavedUserById(target_user_id);
        if(!user_target) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        const userTryingToUpdate: User | null = await this.userRepository.findSavedUserById(modifier_user_id);
        if (!userTryingToUpdate) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        if (userTryingToUpdate.role != UserRole.GESTOR) throw new AppError("USUARIO NAO É GESTOR", 403, "USER_MUST_BE_GESTOR");

        const store: Store | null = await this.storeRepository.findSavedStoreById(modifier_user_store_id);
        if (!store) throw new AppError("Loja não encontrada", 404, "STORE_NOT_FOUND");
        if(store.ownerId != userTryingToUpdate.id) throw new AppError("Usuario precisa ser dessa mesma loja", 404, "USER_MISMATCH");
    

        const finalName: string = (name !== undefined) ? name : user_target.username;
        let finalActive: boolean = user_target.active;

        if(active !== undefined){

            //queremos reativar um funcionario
            if (active === true && !user_target.active){

                const store_plan: SubscriptionPlan = store.plan as SubscriptionPlan;
                const user_role: UserRole = user_target.role as UserRole;

                if (!PLAN_LIMITS[store_plan].limits.max_users[user_role]) throw new Error("Erro! Plano sem numero maximo de usuarios");
                
                const max_quantity_users_this_role_for_this_store: number = PLAN_LIMITS[store_plan].limits.max_users[user_role];

                const all_users: User[] | null = await this.userRepository.listAllSavedUsers(store.id, true); //retorna usuarios ATIVOS

                const all_user_role: User[] = all_users.filter( u => (
                    u.role === user_role
                ));

                if (all_user_role.length >= max_quantity_users_this_role_for_this_store){
                    throw new AppError(`
                        Seu plano ${store_plan} só lhe permite ter até ${max_quantity_users_this_role_for_this_store}
                        para o cargo ${user_role}`, 403, "MAX_ACTIVE_USER_REACHED"
                    );
                }
                
                finalActive = true;
            }

            //queremos desativar um funcionario
            if (active === false && user_target.active){
                finalActive = false;
            }

        } else {
            finalActive = user_target.active
        }



        let finalPasswordHash: string = user_target.passwordHash;






        // Flags de controle
        let shouldInvalidateUserSession = false;  //derrubar sessão do usuario no redis
        let shouldForcePasswordChange = false;   //setar flag no banco
        let shouldInvalidateNameCache = false;   //obrigar o usuario a trocar de senha na proxima vez que for logar


        //SENHA FOI DEFINIDA
        if (password !== undefined){

            finalPasswordHash = await hash(password, 8);

            shouldInvalidateUserSession = true;
            shouldForcePasswordChange = true;

            //apenas o gestor OWNER PODE alterar senhas
            if(store.ownerId != userTryingToUpdate.id) throw new AppError("Apenas o Dono da Loja (Proprietário) tem permissão para isso", 403, "MUST_BE_STORE_OWNER");
        }

        //NOME FOI ALTERADO
        if (name !== undefined){
            if(
                userTryingToUpdate.id != store.ownerId
                &&
                user_target.id == store.ownerId
            ) throw new AppError("Voce nao pode alterar o nome do gestor dono", 403, "YOU_HAVE_NO_POWER");

            if(user_target.id == store.ownerId){
                shouldInvalidateNameCache = true;
            }
        }

        //USUARIO FOI DESATIVADO
        if (finalActive === false && user_target.active === true){ 
            shouldInvalidateUserSession = true;
        }

        // --------------------------
        // INVALIDAÇÃO NO REDIS
        // --------------------------
        if (shouldInvalidateUserSession){ //a partir de agora a proxima requisicao ja sera barrada no 'authMiddleware'
            const newVersion = Date.now();

            const cacheKey:string = CacheKeys.User.TOKEN_VERSION(target_user_id);

            await this.cacheProvider.save(
                cacheKey,
                newVersion,
                86400 
            )
        }

        // --------------------------
        // ATUALIZAÇÃO NO BANCO
        // --------------------------
        if(finalActive === false && target_user_id == userTryingToUpdate.id) throw new AppError("Dono da loja nao pode desativar a si mesmo", 403, "OWNER_CANNOT_DEACTIVATE_ITSELF")
        

        //gera a entidade com dados básicos atualizados
        let updatedUser: User = user_target.withUpdatedData(finalName, finalPasswordHash, finalActive);

        //APLICAÇÃO CONDICIONAL DA FLAG
        if (shouldForcePasswordChange) {
            updatedUser = updatedUser.setMustChangePasswordToTrue();
        }

        if (shouldInvalidateNameCache){
            const cacheKey: string = CacheKeys.Store.SUMMARY(modifier_user_store_id);
            await this.cacheProvider.invalidate(cacheKey);
        }

        //limpa o cache
        const cacheKey: string = CacheKeys.User.USERS_DATA(store.id);
        await this.cacheProvider.invalidate(cacheKey);

        await this.userRepository.updateSavedUser(updatedUser);
    }
}