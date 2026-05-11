import { User, type AuthorizedDeviceProps } from "../../entities/user.js"
import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import type { ITokenProvider } from "../../providers/interfaces/token.provider.interface.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { IHashedStringProvider } from "../../../../shared/providers/HashedStringProvider/models/IHashedStringProvider.js";
import { randomInt } from 'node:crypto';
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import type { IMailProvider } from "../../../../shared/providers/EmailProvider/interface/IMailProvider.js";

export const TEN_MINUTES_IN_SECONDS: number = 60 * 10;

interface IRequest {
    email: string,
    password: string,
    device_id: string | string[] | null | undefined
}

export type DeviceAuthorizationData = {
    authorization_code: string,
    device_id: string,
    last_time_fetched_at: string | null//used to build a 'cool-down' logic between attempts in the 'ConfirmDeviceUseCase', to avoid exploitation
    failed_attemps: number
}

export interface ILoginSucess {
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


export type LoginResult = 
    |   { 
            status: "SUCCESS";
            data: ILoginSucess
        }
    |   { 
            status: "DEVICE_CONFIRMATION_REQUIRED";
            data: { pre_auth_token: string }
        }


//1 - Find user by email
//2 - Verify if password matches
//3 - Verify if the device is authorized
        //3.1 - Generate 'device_id'
        //3.2 - Generate 'device_authorization_code'
        //3.3 - Generate an 'DeviceAuthorizationData' object
            //3.3.1 Generate an cacheKey to save the 'DeviceAuthorizationData' object in the cache
        //3.4 - Save the 'DeviceAuthorizationData' object in the cache
        //3.5 - Send email to the user with the 'authorization_code' from the 'DeviceAuthorizationData' object
        //3.6 - Generate and return and JWT Token called 'pre_auth_token' to authorize the next route (/confirm-device'), that gonna be used to confirm the 'authorization_code' sent to email
//4 - Return an 'ILoginSucess' object


export class LoginUseCase {

    constructor(
        private userRepository: IUserRepository,
        private tokenProvider: ITokenProvider,
        private hasheStringProvider: IHashedStringProvider,
        private cacheProvider: ICacheProvider,
        private emailProvider: IMailProvider,
    ) {}

    async execute({ email, password, device_id }:IRequest): Promise<LoginResult>{

        if (!email || !password) {
            throw new AppError("'email' e 'senha' são obrigatórios.", 400, "INVALID_CREDENTIALS");
        }

        if (typeof(device_id) !== 'string'){
            throw new AppError("Id do dispositivo invalido", 400, "INVALID_DEVICE_ID");
        }

        //1 - Find user by email
        const user: User | null = await this.userRepository.findUserByEmail(email);
        if(!user) throw new AppError("Email ou senha incorretos", 404, "INVALID_CREDENTIALS");
        if (!user.active) throw new AppError("Usuário inativo. Contate o administrador do sistema", 403, "USER_DISABLED");

        //2 - Verify if password matches
        const passwordMatch: boolean = await this.hasheStringProvider.compare(password, user.passwordHash);
        if (!passwordMatch) throw new AppError("Usuario ou senha incorretos", 404, "INVALID_CREDENTIALS");

        const isDeviceAuthorized: AuthorizedDeviceProps | undefined = user.authorized_devices.find((item) => item.device_id === device_id);

        if (!isDeviceAuthorized){

            const cacheKey: string = CacheKeys.User.TEMPORARY_AUTHORIZE_DEVICE_CODE(user.id, device_id);
            const existingAuthData: AuthorizedDeviceProps | null = await this.cacheProvider.get<AuthorizedDeviceProps>(cacheKey);
            if (existingAuthData) {
                // Já existe um código válido enviado há menos de 10 minutos!
                // Não geramos um novo código e NÃO enviamos um novo e-mail.
                // Apenas renovamos o crachá de acesso à rota de confirmação.
                const preAuthToken: string = this.tokenProvider.generatePreAuthToken(user.id);
                
                return {
                    status: "DEVICE_CONFIRMATION_REQUIRED",
                    data: {
                        pre_auth_token: preAuthToken
                    }
                }
            }

            //3.2 - Generate 'device_authorization_code'
            const authorize_device_code: string = randomInt(100000, 1000000).toString();
            
            //3.3 - Generate an 'DeviceAuthorizationData' object
            const deviceAuthorizationData: DeviceAuthorizationData = {
                authorization_code: authorize_device_code,
                device_id,
                last_time_fetched_at: null,
                failed_attemps: 0
            }

            //3.3.1 Generate an cacheKey to save the 'DeviceAuthorizationData' object in the cache

            //3.4 - Save the 'DeviceAuthorizationData' object in the cache
            await this.cacheProvider.save(
                cacheKey,
                deviceAuthorizationData,
                TEN_MINUTES_IN_SECONDS
            )

            const emailTemplateWithDeviceAuthorizationCode: string = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Bem-vindo à Manga Food!</h2>
                    <p>Use o código abaixo para autorizar seu novo dispositivo:</p>
                    <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; width: fit-content;">
                        <strong style="font-size: 24px; letter-spacing: 3px;">${authorize_device_code}</strong>
                    </div>
                    <p><small>Este código expira em ${TEN_MINUTES_IN_SECONDS/60} minutos.</small></p>
                </div>
            `;

            //3.5 - Send email to the user with the 'authorization_code' from the 'DeviceAuthorizationData' object
            await this.emailProvider.sendMail({
                to: user.email,
                subject: `Codigo para autorizacao de dispositivo válido por até ${TEN_MINUTES_IN_SECONDS/60} minutos`,
                body: emailTemplateWithDeviceAuthorizationCode
            });

            //3.6 - Generate and return and JWT Token called 'pre_auth_token' to authorize the next route (/confirm-device'), that gonna be used to confirm the 'authorization_code' sent to email
            const preAuthToken: string = this.tokenProvider.generatePreAuthToken(user.id);
            return {
                status: "DEVICE_CONFIRMATION_REQUIRED",
                data:{
                    pre_auth_token: preAuthToken
                }
            }
            
        }
        
        ////////////////////////////////////////
        //WHITELSIT -> CACHE NO REDIS - INICIO

        const tokenVersion: number = Date.now();

        const cacheKey: string = CacheKeys.User.TOKEN_VERSION(user.id);

        await this.cacheProvider.save(
            cacheKey,
            tokenVersion.toString(),
            86400 //um dia
        )

        ////////////////////////////////////////
        //WHITELSIT -> CACHE NO REDIS - FIM

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
                    store_id: user.paying_user ? null : user.storeId, //se for um usuario paga, retorna null, para que ele possa ir escolher sua loja. Se for um usuario criado, ja retorna com o id da loja
                    username: user.username,
                    role: user.role,
                    must_change_password: user.mustChangePassword,
                    is_paying_user: user.paying_user,
                    token_version: tokenVersion
                }
            }
        };

    }
}