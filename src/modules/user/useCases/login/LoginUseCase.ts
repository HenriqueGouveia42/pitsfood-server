import { User, type AuthorizedDeviceProps } from "../../entities/user.js"
import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import type { ITokenProvider } from "../../providers/interfaces/token.provider.interface.js";
import type { IHashedStringProvider } from "../../../../shared/providers/interfaces/hashedStringProvider/IHashedStringProvider.js";
import type {IDeviceAuthorizationChallengeService} from "../../services/DeviceAuthorizationChallengeService.js";
import type { IWhiteListViaAuthTokenVersionService, WhiteListOutputDTO } from "../../services/WhiteListViaAuthTokenVersionService.js";

export const TEN_MINUTES_IN_SECONDS: number = 60 * 10;



export type DeviceAuthorizationData = {
    authorization_code: string,
    device_id: string,
    last_time_fetched_at: string | null// used to build a 'cool-down' logic between attempts in the 'ConfirmDeviceUseCase', to avoid exploitation
    failed_attemps: number
}

export type LoginUseCaseInputDTO = {
    email: string,
    password: string,
    device_id: string | string[] | null | undefined
}

export type LoginUseCaseOutputDTO =  
       { 
            status: "SUCCESS";
            data: {
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
        }
    |   { 
            status: "DEVICE_CONFIRMATION_REQUIRED";
            data: { pre_auth_token: string }
        }
        

export interface ILoginUseCase{
    execute({ email, password, device_id }:LoginUseCaseInputDTO): Promise<LoginUseCaseOutputDTO>;
}

export class LoginUseCase implements ILoginUseCase {

    constructor(
        private userRepository: IUserRepository,
        private tokenProvider: ITokenProvider,
        private hasheStringProvider: IHashedStringProvider,
        private deviceAuthorizationChallenge: IDeviceAuthorizationChallengeService,
        private whiteListCache: IWhiteListViaAuthTokenVersionService
    ) {}

    async execute({ email, password, device_id }:LoginUseCaseInputDTO): Promise<LoginUseCaseOutputDTO>{

        if (!email || !password || typeof(device_id) !== 'string') {
            throw new AppError("Algum dado está incorreto", 400, "INVALID_CREDENTIALS");
        }

        // 1. Buscar o usuario no banco de dados
        const user: User | null = await this.userRepository.findUserByEmail(email);

        // 1.1. Realizar as devidas validações. Algumas são redundantes, pois já são validadas na criação na entidade, mas tudo bem, é a vida
        if(!user) throw new AppError("Email ou senha incorretos", 404, "INVALID_CREDENTIALS");
        if (!user.active) throw new AppError("Usuário inativo. Contate o administrador do sistema", 403, "USER_DISABLED");
        if (user.paying_user && user.storeId) throw new AppError("Um usuario pago não pode ter a propriedade 'storeId'", 422, "INVALID_ENTITY");

        // 2. Verificar se a senha está correta
        const passwordMatch: boolean = await this.hasheStringProvider.compare(password, user.passwordHash);
        if (!passwordMatch) throw new AppError("Usuario ou senha incorretos", 404, "INVALID_CREDENTIALS");

        // 3. Verificar se o login está sendo feito de um dispositivo autorizado
        const isDeviceAuthorized: AuthorizedDeviceProps | undefined = user.authorized_devices.find((item) => item.device_id === device_id);

        // 3.1. Se não estiver, executar o usecase de autorizacao de dispositivo
        if (!isDeviceAuthorized){
            return await this.deviceAuthorizationChallenge.execute(user, device_id)
        }
       
        // 4. Executar a lógica de WhiteList no redis, que validará todas as requisições futuras atravpes do middleware "authMiddleware"
        const { tokenVersion }: WhiteListOutputDTO = await this.whiteListCache.execute({
            user_id: user.id
        })

        // 5. Gerar o que de fato vai ser o token de login
        const token: string = this.tokenProvider.generateToken(
            user.id,
            user.role,
            user.paying_user ? null : user.storeId, //agora quando logar, se for dono da loja, recebe "null" pois ele ainda nao se vinculou a loja
            user.mustChangePassword,
            tokenVersion,
            user.paying_user //se ele for o dono, o gestor paga que paga o plano, etc, isso vai no token
        )
        
        return {
            status: "SUCCESS",
            data:{
                token,
                user: {
                    id: user.id,
                    store_id: user.paying_user ? null : user.storeId, //se for um usuario pago, retorna null, para que ele possa ir escolher sua loja. Se for um usuario criado, ja retorna com o id da loja
                    username: user.username,
                    role: user.role,
                    must_change_password: user.mustChangePassword,
                    is_paying_user: user.paying_user,
                    token_version: tokenVersion,
                }
            }
        };
    }
}