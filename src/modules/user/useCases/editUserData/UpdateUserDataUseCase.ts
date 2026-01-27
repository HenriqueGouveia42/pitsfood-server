import { hash } from "bcryptjs"; 
import type { IUserRepository } from "../../repositories/user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { User } from "../../entities/user.js";
import { UserRole } from "../../entities/user.js"; 
import type { IStoreRepository } from "../../../store/repositories/store.repository.interface.js";
import { Store } from "../../../store/entities/store.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";

export interface IRequestUseCase {
    target_user_id: string;
    owner_id: string
    owner_store_id: string,
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
        owner_id,
        owner_store_id,
        name,
        password, 
        active, 
    }: IRequestUseCase): Promise<void> {
        
        // ... (Todas as validações de segurança permanecem iguais) ...
        const user_target: User | null = await this.userRepository.findSavedUserById(target_user_id);
        if(!user_target) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        
        const ownerTryingToUpdate: User | null = await this.userRepository.findSavedUserById(owner_id);
        if (!ownerTryingToUpdate) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        if (ownerTryingToUpdate.storeId != user_target.storeId) throw new AppError("ID de usuario nao existe nessa loja", 404, "MUST_BE_THE_SAME_STORE");
        if (ownerTryingToUpdate.role != UserRole.GESTOR) throw new AppError("USUARIO NAO É GESTOR", 403, "USER_MUST_BE_GESTOR");
        if (ownerTryingToUpdate.storeId != owner_store_id) throw new AppError("Inconsistência: Token não pertence à loja do usuário", 404, "USER_MUST_BE_OWNER");

        const store: Store | null = await this.storeRepository.findSavedStoreById(owner_store_id);
        if (!store) throw new AppError("Loja não encontrada", 404, "STORE_NOT_FOUND");
        if(store.ownerId != ownerTryingToUpdate.id) throw new AppError("Apenas o Dono da Loja (Proprietário) tem permissão para isso", 403, "MUST_BE_STORE_OWNER");


        // --------------------------
        // PREPARAÇÃO DE DADOS
        // --------------------------

        const finalName: string = (name !== undefined) ? name : user_target.username;
        const finalActive: boolean = (active !== undefined) ? active : user_target.active;
        
        let finalPasswordHash: string = user_target.passwordHash;

        // Flags de controle
        let shouldInvalidateSession = false;     // Para derrubar do Redis
        let shouldForcePasswordChange = false;   // Para setar flag no Banco

        // 1. SE A SENHA FOI DEFINIDA
        if (password !== undefined){ 
            finalPasswordHash = await hash(password, 8);
            shouldInvalidateSession = true;
            shouldForcePasswordChange = true; // <--- SÓ AQUI ATIVAMOS A FLAG
        }

        // 2. SE O USUARIO FOI DESATIVADO
        if (finalActive === false && user_target.active === true){ 
            shouldInvalidateSession = true;
        }

        // --------------------------
        // INVALIDAÇÃO NO REDIS
        // --------------------------
        if (shouldInvalidateSession){
            const newVersion = Date.now(); 
            await this.cacheProvider.save(
                `user-token-version:${target_user_id}`,
                newVersion.toString(),
                86400 
            )
        }

        // --------------------------
        // ATUALIZAÇÃO NO BANCO
        // --------------------------
        if(finalActive === false && target_user_id == ownerTryingToUpdate.id){
            throw new AppError("Dono da loja nao pode desativar a si mesmo", 403, "OWNER_CANNOT_DEACTIVATE_ITSELF")
        }

        // Gera a entidade com dados básicos atualizados
        let updatedUser: User = user_target.withUpdatedData(finalName, finalPasswordHash, finalActive);

        // APLICAÇÃO CONDICIONAL DA FLAG
        if (shouldForcePasswordChange) {
            updatedUser = updatedUser.setMustChangePasswordToTrue();
        }

        await this.userRepository.updateSavedUser(updatedUser);
    }
}