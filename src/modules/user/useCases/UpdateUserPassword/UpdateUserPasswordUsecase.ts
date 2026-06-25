import { hash } from "bcryptjs"; 
import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { User, UserRole } from "../../entities/user.js"; 
import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

export interface IUpdatePasswordRequest {
    target_user_id: string;
    modifier_user_id: string;
    modifier_user_store_id: string;
    password: string;
}

export class UpdateUserPasswordUseCase {
    constructor(
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository,
        private cacheProvider: ICacheProvider,
    ) {}

    //USECASE ONDE UM GESTOR ALTERA A SENHA DE UM FUNCIONARIO

    async execute({ target_user_id, modifier_user_id, modifier_user_store_id, password }: IUpdatePasswordRequest): Promise<void> {
        
        const user_target = await this.userRepository.findSavedUserById(target_user_id);
        if (!user_target) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        const userTryingToUpdate = await this.userRepository.findSavedUserById(modifier_user_id);
        if (!userTryingToUpdate) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        if (userTryingToUpdate.role !== UserRole.GESTOR) throw new AppError("USUARIO NAO É GESTOR", 403, "USER_MUST_BE_GESTOR");

        if(userTryingToUpdate.id === user_target.id){
            throw new AppError("Um gestor não pode atualizar a prória senha por aqui. Vá para a tela de login e clique em 'Esqueci a minha senha'");
        }

        const store = await this.storeRepository.findSavedStoreById(modifier_user_store_id);
        if (!store) throw new AppError("Loja não encontrada", 404, "STORE_NOT_FOUND");
        if (store.ownerId !== userTryingToUpdate.id) throw new AppError("Apenas o Dono da Loja tem permissão para isso", 403, "MUST_BE_STORE_OWNER");

        const hashedPassword: string = await hash(password, 8);
        const updatedUser: User = user_target.setNewPassword(hashedPassword).setMustChangePasswordToTrue();


        await Promise.all([
            this.userRepository.updateSavedUser(updatedUser), //atualiza o user no banco
            this.cacheProvider.save(CacheKeys.User.TOKEN_VERSION(target_user_id), Date.now(), 86400), //ja atualiza a nova versao do jwt dele
            this.cacheProvider.invalidate(CacheKeys.User.USERS_DATA(store.id)) //invalida a chave de dados dos usuarios no banco  - invalida o cache antigo
        ]);
    }
}