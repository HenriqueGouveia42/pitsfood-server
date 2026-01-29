import { compare } from "bcryptjs";
import { User } from "../../entities/user.js"
import type { IUserRepository } from "../../repositories/user.repository.interface.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import type { ITokenProvider } from "../../providers/token.provider.interface.js";
import { cacheProvider } from "../../../../shared/providers/CacheProvider/index.js";

interface IRequest {
    email: string,
    password: string,
}

export interface ILoginResponse {
    token: string,
    user: {
        id: string,
        username: string,
        role: string,
        store_id: string | null,
        must_change_password: boolean,
    }
}

export class LoginUseCase {

    //injecao de dependencia
    //o "LoginUseCase" pede as interfaces dos repositorios no construtor
    //quem vai entregar as implementacoes reais (Prisma por exemplo) é o arquivo index.ts (Factory)
    constructor(
        private userRepository: IUserRepository,
        private tokenProvider: ITokenProvider
    ) {}

    async execute({ email, password }:IRequest): Promise<ILoginResponse>{

        const user: User | null = await this.userRepository.findUserByEmail(email);

        if(!user){
            throw new AppError("Email ou senha incorretos", 404, "INVALID_CREDENTIALS")
        }

        if (!user.active){
            throw new AppError("Usuário inativo. Contate o administrador do sistema", 403, "USER_DISABLED")
        }

        //comparar a senha enviada (plain-text) com o hash do banco
        const passwordMatch = await compare(password, user.passwordHash);

        if (!passwordMatch){
            throw new AppError("Usuario ou senha incorretos", 404, "INVALID_CREDENTIALS")
        }
        // ---------------------------------------------
        // LOGICA DE WHITELIST (VERSÃO DO TOKEN PELO REDIS) - INICIO
        // ---------------------------------------------

        const tokenVersion = Date.now();

        await cacheProvider.save(
            `user-token-version:${user.id}`,
            tokenVersion.toString(),
            86400 //um dia
        )

        const token = this.tokenProvider.generateToken(
            user.id,
            user.role,
            user.storeId ? user.storeId : null,
            user.mustChangePassword,
            tokenVersion
        )

        // ---------------------------------------------
        // LOGICA DE WHITELIST (VERSÃO DO TOKEN PELO REDIS) - FINAL
        // ---------------------------------------------

        return {
            token,
            user: {
                id: user.id,
                store_id: user.storeId ? user.storeId : null,
                username: user.username,
                role: user.role,
                must_change_password: user.mustChangePassword
            }
        };

    }
}