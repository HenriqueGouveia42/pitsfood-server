import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js";
import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";

import { User } from "../../entities/user.js";
import type { BuildUserProps } from "../../entities/user.js";

import bcrypt from "bcryptjs";
import { UserRole } from "../../entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { Store } from "../../../store/entities/store.js";
import { validateCPF } from "../../../../shared/validators/valid.cpf.js";
import { validCNPJ } from "../../../../shared/validators/valid.cnpj.js";

import { PLAN_LIMITS } from "../../../../config/plans.config.js";
import { SubscriptionPlan } from "../../../store/entities/store.enums.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import { uuid } from "zod";

interface RegisterEmployeeUseCaseRequest{
    name: string,
    role: string,
    plain_text_password: string,
    userId: string,
    email: string,
    cpf_cnpj: string | null | undefined,
    phone: string | null,
    target_store_id: string | null | undefined
}

export interface RegisterEmployeeUseCaseResponse{
    name: string,
    role: string,
}

export class RegisterEmployeeUseCase{
   constructor(
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository,
        private cacheProvider: ICacheProvider
   ){} 

   async execute({ name, role, plain_text_password, userId, email, cpf_cnpj, phone, target_store_id}: RegisterEmployeeUseCaseRequest): Promise<RegisterEmployeeUseCaseResponse>{
    
        
        if (typeof(target_store_id) !== 'string'){
            throw new AppError("Id da loja ausente", 404, "STORE_ID_NOT_FOUND");
        }

        const userAlreadyExists = await this.userRepository.findUserByEmail(email);
        if (userAlreadyExists) throw new AppError("Este e-mail está indisponível.", 400, "INVALID_EMAIL");

        const manager_user: User | null = await this.userRepository.findSavedUserById(userId);
        if (!manager_user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        if (manager_user.role != UserRole.GESTOR) throw new AppError("Usuario precisa ser GESTOR para criar uma loja", 403, "MUST_BE_GESTOR");
        if (!manager_user.paying_user) throw new AppError("Usuario gestor precisa ser um gestor pago, ou seja, aquele que criou a loja!");

        const store: Store | null = await this.storeRepository.findSavedStoreById(target_store_id);
        if (!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND")
        if (store.ownerId != manager_user.id) throw new AppError("O usuario não é o dono da loja", 403, "MUST_BE_THE_OWNER");

        //PRECISAMOS SABER SE A LOJA JÁ ATINGIU A QUANTIDADE MAXIMA DE USUARIOS COM ESSE CARGO PARA O SEU PLANO

        const store_plan: SubscriptionPlan = store.plan as SubscriptionPlan;
        const user_role: UserRole = role as UserRole;
        const max_quantity_users_this_role_for_this_store: number | null | undefined = PLAN_LIMITS[store_plan].limits.max_users[user_role];

        if (!max_quantity_users_this_role_for_this_store && typeof(max_quantity_users_this_role_for_this_store) !== 'number'){
            throw new Error("Erro. Plano sem quantidade maxima de usuarios")
        }
        const all_users: User[] | null = await this.userRepository.listAllSavedUsers(store.id, true);

        const all_user_role: User[] = all_users.filter( u => (
            u.role === user_role
        ));

        if (all_user_role.length >= max_quantity_users_this_role_for_this_store){
            throw new AppError(`
                Seu plano ${store_plan} só lhe permite ter até ${max_quantity_users_this_role_for_this_store}
                para o cargo ${user_role}`, 403, "MAX_ACTIVE_USER_REACHED");
        }
            

        const hashed_password: string = await bcrypt.hash(plain_text_password, 8);

        if (cpf_cnpj){
            const isCPFValid: boolean = validateCPF(cpf_cnpj);
            const isCNPJValid: boolean = validCNPJ(cpf_cnpj);
            if (!isCPFValid && !isCNPJValid) throw new AppError("CPF/CNPJ invalido", 400, "CPF_CNPJ_MUST_BE_VALID");

            const cpf_cnpj_user: User | null = await this.userRepository.findUserByCPFCNPJ(cpf_cnpj);
            if (cpf_cnpj_user) throw new AppError("Usario com esse CPF/CNPJ ja existe no sistema", 403, "CPF_CNPJ_USER_ALREADY_EXISTS");
        }
        
        
        const new_employee_user_id: string = crypto.randomUUID()

        const now_date: string = new Date().toISOString();
        
        const build_props: BuildUserProps = {
            user_id: new_employee_user_id,
            nowDate: now_date,
            username: name,
            password_hash: hashed_password,
            role: user_role,
            email: email,
            store_id: store.id,
            must_change_password: true,
            is_paying_user: false,
            cpf_cnpj: cpf_cnpj ? cpf_cnpj : null,
            phone: phone ? phone : null
        }
        const user: User = User.buildUser(build_props);

        //limpa o cache
        const cacheKey: string = CacheKeys.User.USERS_DATA(store.id);
        await this.cacheProvider.invalidate(cacheKey);

        await this.userRepository.saveUser(user);

        const response: RegisterEmployeeUseCaseResponse = {
            name: user.username,
            role: user.role,
        }

        return response;
    }
}