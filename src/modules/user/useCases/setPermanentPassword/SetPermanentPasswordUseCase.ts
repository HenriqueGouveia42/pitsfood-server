import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js";
import { User } from "../../entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { compare, hash } from "bcryptjs";

import type { ITokenProvider } from "../../providers/interfaces/token.provider.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

interface IsetPermanentPasswordRequest {
    current_password: string,
    new_password: string,
    userId: string
}

interface IsetPermanentPasswordResponse {
    token: string;
}

export class SetPermanentPasswordUseCase {

    constructor(
        private userRepository: IUserRepository,
        private tokenProvider: ITokenProvider,
        private cacheProvider: ICacheProvider
    ){}

    public async execute ({ current_password, new_password, userId }: IsetPermanentPasswordRequest): Promise<IsetPermanentPasswordResponse> {

        const user: User | null = await this.userRepository.findSavedUserById(userId);

        if(!user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND")
        
        if(current_password === new_password) throw new AppError("A nova senha deve ser diferente da atual", 400, "PASSWORDS_MUST_BE_DIFFERENT")
        
        const passwordMatch = await compare(current_password, user.passwordHash);

        if (!passwordMatch) throw new AppError("Senha atual incorreta", 401, "INVALID_CREDENTIALS") //401 é melhor aqui
        
        const hashedPassword = await hash(new_password, 8);
        
        let updatedUser: User = user.setNewPassword(hashedPassword);

        updatedUser = updatedUser.setMustChangePasswordToFalse();

        //persiste no banco
        await this.userRepository.updateSavedUser(updatedUser);

        // ==========================================================
        // LÓGICA DO REDIS (WHITELIST)
        // ==========================================================
        
        //gera nova versão (Invalida imediatamente o token antigo que está no cookie), que vai ser barrado pelo 'authMiddleware'
        const tokenNewVersion: number = Date.now();

        //persiste no redis
        const cacheKey: string = CacheKeys.User.TOKEN_VERSION(user.id);

        await this.cacheProvider.save(
            cacheKey, 
            tokenNewVersion.toString(), 
            86400 //1 dia
        );

        //gera o novo Token com a flag 'must_change_password' = false e a NOVA VERSÃO
        const newToken = this.tokenProvider.generateToken(
            updatedUser.id,
            updatedUser.role,
            updatedUser.storeId ? updatedUser.storeId : null,
            false, //'must_change_password' agora é explicitamente false
            tokenNewVersion, //versão sincronizada com o redis
            false
        );

        return { token: newToken };
    }
}