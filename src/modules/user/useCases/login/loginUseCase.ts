import { compare } from "bcryptjs";
import { User } from "../../entities/user.js"
import type { IUserRepository } from "../../repositories/user.repository.interface.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import type { ITokenProvider } from "../../providers/token.provider.interface.js";
import { cacheProvider } from "../../../../shared/providers/CacheProvider/index.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

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
        is_paying_user: boolean,
        token_version: number
    }
}
//Aqui o usuario deve logar na sua conta, mas nao deve receber o "store_id" aqui
//Deve haver uma outra rota para o usuario LOGADO se vincular a uma loja que ele criou,
//e aí sim nessa rota ele vai receber o "store_id". Dessa forma, um usuario pode criar várias lojas

export class LoginUseCase {

    constructor(
        private userRepository: IUserRepository,
        private tokenProvider: ITokenProvider
    ) {}

    async execute({ email, password }:IRequest): Promise<ILoginResponse>{

        const user: User | null = await this.userRepository.findUserByEmail(email);
        if(!user) throw new AppError("Email ou senha incorretos", 404, "INVALID_CREDENTIALS");
        if (!user.active) throw new AppError("Usuário inativo. Contate o administrador do sistema", 403, "USER_DISABLED")

        const passwordMatch = await compare(password, user.passwordHash);
        if (!passwordMatch)throw new AppError("Usuario ou senha incorretos", 404, "INVALID_CREDENTIALS") 
        
        ////////////////////////////////////////
        //WHITELSIT -> CACHE NO REDIS - INICIO

        const tokenVersion = Date.now();

        const cacheKey = CacheKeys.User.TOKEN_VERSION(user.id);

        await cacheProvider.save(
            cacheKey,
            tokenVersion.toString(),
            86400 //um dia
        )

        ////////////////////////////////////////
        //WHITELSIT -> CACHE NO REDIS - FIM

        const token = this.tokenProvider.generateToken(
            user.id,
            user.role,
            user.paying_user ? null : user.storeId, //agora quando logar, se for dono da loja, recebe "null" pois ele ainda nao se vinculou a loja
            user.mustChangePassword,
            tokenVersion,
            user.paying_user //se ele for o dono, o gestor paga que paga o plano, etc, isso vai no token
        )
        
        return {
            token,
            user: {
                id: user.id,
                store_id: user.paying_user ? null : user.storeId, //se for um usuario paga, retorna null, para que ele possa ir escolher sua loja. Se for um usuario criado, ja retorna com o id da loja
                username: user.username,
                role: user.role,
                must_change_password: user.mustChangePassword,
                is_paying_user: user.paying_user,
                token_version: tokenVersion
            }
        };

    }
}