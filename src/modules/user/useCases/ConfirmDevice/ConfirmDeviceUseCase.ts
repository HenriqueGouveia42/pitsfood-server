import { AppError } from "../../../../shared/errors/AppError.js"
import { CacheKeys } from "../../../../shared/constants/cache-keys.js"
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js"
import type { DeviceAuthorizationData, ILoginSucess } from "../login/loginUseCase.js" // Importando o contrato de resposta

/*export type DeviceAuthorizationData = {
    authorization_code: string,
    device_id: string,
    last_time_fetched_at: string //used to build a 'cool-down' logic between attempts in the 'ConfirmDeviceUseCase', to avoid exploitation
    failed_attemps: number
}*/


import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js"
import { User } from "../../entities/user.js"
import type { ITokenProvider } from "../../providers/interfaces/token.provider.interface.js"

export type inputDTO = {
    device_id: string //sent from front-end
    authorize_device_code: string, //sent from front-end
    device_name: string, //sent form front-end
    user_id: string //anexed by 'pre_auth_token'
}

const MAX_ATTEMPTS_TO_AUTHORIZE_DEVICE_ALLOWED: number = 4;
const ONE_MINUTE_COOL_DOWN_IN_MS: number = 1000 * 60;


//1 - First verifications
//2 - Generate the cache-key to fetch the 'DeviceAuthorizationData' object previously saved by 'loginUseCase'
//3 - Fetch the 'DeviceAuthorizationData' object
    //3.1 - 'cache-key' incorrect. At least one of 'user_id' or 'device_id' is incorrect
//4 - Verify the cool-down
//5 - Verify if the property 'authorization_code' matches 
    //5.1 - property 'authorization_code' does not matches. Verify if the maximum quantity does not reached, and update the 'failed_attemps' property of 'DeviceAuthorizationData' object
//6 - Fetch the 'user' and make verifications
//7 - Update the 'user' entity to handle onde more authorized device
//8 - Persists 'user'
//9 - Invalidate 'DeviceAuthorizationData'
//10 - Login


export class ConfirmDeviceUseCase {
    constructor(
        private cacheProvider: ICacheProvider,
        private userRepository: IUserRepository,
        private tokenProvider: ITokenProvider // Precisamos disso para gerar o token final
    ){}

    async execute(input: inputDTO): Promise<ILoginSucess> {

        const now: Date = new Date();

        //1 - First verifications
        if (!input.device_id) throw new AppError("device_id ausente ou inválido", 400, "INVALID_DEVICE_ID");
        if (!input.authorize_device_code) throw new AppError("Código de confirmacao ausente ou invalido", 400, "INVALID_CONFIRMATION_CODE");
        if (!input.user_id) throw new AppError("Id do usuario inexistente ou invalido", 400, "INVALID_USER_ID");
        if (!input.device_name || input.device_name.length > 40) throw new AppError("Nome invalido", 400, "INVALID_NAME");

        //2 - Generate the cache-key to fetch the 'DeviceAuthorizationData' object previously saved by 'loginUseCase'
        const cache_key: string = CacheKeys.User.TEMPORARY_AUTHORIZE_DEVICE_CODE(
            input.user_id,
            input.device_id
        );

        //3 - Fetch the 'DeviceAuthorizationData' object
        const deviceData: DeviceAuthorizationData | null = await this.cacheProvider.get<DeviceAuthorizationData>(cache_key);

        /*if (!deviceData || deviceData.authorization_code !== input.authorize_device_code) {
            throw new AppError("Código de autorização inválido ou expirado.", 401, "INVALID_AUTHORIZATION_CODE");
        }*/

        //3.1 - 'cache-key' incorrect. At least one of 'user_id' or 'device_id' is incorrect
        if(!deviceData){
            throw new AppError("Código de autorização inválido ou expirado.", 401, "INVALID_AUTHORIZATION_CODE");
        }

        //4 - Verify the cool-down
        if(deviceData.last_time_fetched_at){

            const timeSinceLastFailure: number = now.getTime() - new Date(deviceData.last_time_fetched_at).getTime();
            if(timeSinceLastFailure < ONE_MINUTE_COOL_DOWN_IN_MS){

                throw new AppError(
                    `Aguarde ${Math.floor((ONE_MINUTE_COOL_DOWN_IN_MS - timeSinceLastFailure) / 1000)} segundos para tentar novamente`, 
                    429, 
                    "TOO_MANY_REQUESTS"
                );
            }
        }
        

        //5 - Verify if the property 'authorization_code' matches 
        if(input.authorize_device_code !== deviceData.authorization_code){
            
            //5.1 - property 'authorization_code' does not matches. Verify if the maximum quantity does not reached, and update the 'failed_attemps' property of 'DeviceAuthorizationData' object

            if (deviceData.failed_attemps + 1 > MAX_ATTEMPTS_TO_AUTHORIZE_DEVICE_ALLOWED){

                await this.cacheProvider.invalidate(cache_key);

                throw new AppError("Dispositivo nao pode ser autorizado", 403, "DEVICE_CAN_NOT_BE_AUTHORIZED");

            }

            const updated_authorization_data: DeviceAuthorizationData = {
                authorization_code: deviceData.authorization_code,
                device_id: deviceData.device_id,
                last_time_fetched_at: now.toISOString(),
                failed_attemps: deviceData.failed_attemps + 1
            }

            await this.cacheProvider.overwrite(cache_key, updated_authorization_data);

            throw new AppError("Dispositivo nao pode ser autorizado, tente novamente", 403, "DEVICE_CAN_NOT_BE_AUTHORIZED");
        }


        //6 - Fetch the 'user' and make verifications
        const user: User | null = await this.userRepository.findSavedUserById(input.user_id);
        if (!user) throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
        if (!user.active) throw new AppError("Usuário inativo. Contate o administrador do sistema.", 403, "USER_DISABLED");

        //7 - Update the 'user' entity to handle onde more authorized device
        const updated_user: User = user.addAuthorizedDeviceId(deviceData.device_id, input.device_name, now);

        //8 - Persists 'user'
        await this.userRepository.addAuthorizedDevice(user.id, input.device_id, input.device_name);

        //9 - Invalidate 'DeviceAuthorizationData'
        await this.cacheProvider.invalidate(cache_key);

        //10 - Login
        const tokenVersion: number = Date.now();
        const tokenCacheKey: string = CacheKeys.User.TOKEN_VERSION(user.id);

        await this.cacheProvider.save(
            tokenCacheKey,
            tokenVersion.toString(),
            86400 // um dia
        );

        const token: string = this.tokenProvider.generateToken(
            user.id,
            user.role,
            user.paying_user ? null : user.storeId, 
            user.mustChangePassword,
            tokenVersion,
            user.paying_user 
        );

        // 7. Retorna exatamente o mesmo contrato do LoginUseCase
        return {
            token,
            user: {
                id: user.id,
                store_id: user.paying_user ? null : user.storeId, 
                username: user.username,
                role: user.role,
                must_change_password: user.mustChangePassword,
                is_paying_user: user.paying_user,
                token_version: tokenVersion
            }
        };
    }
}