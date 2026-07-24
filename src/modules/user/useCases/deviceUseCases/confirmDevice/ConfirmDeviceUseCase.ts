import { AppError } from "../../../../../shared/errors/AppError.js"
import { CacheKeys } from "../../../../../shared/constants/cache-keys.js"
import type { ICacheProvider } from "../../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js"
import type { DeviceAuthorizationData, ILoginSucess } from "../../login/LoginUseCase.js"
import type { ITokenProvider } from "../../../providers/interfaces/token.provider.interface.js"
import type { AuthorizeDeviceService } from "../../../services/AuthorizeDeviceService.js"

export type inputDTO = {
    device_id: string,
    authorize_device_code: string,
    device_name: string,
    user_id: string
}

const MAX_ATTEMPTS_TO_AUTHORIZE_DEVICE_ALLOWED: number = 4;
const ONE_MINUTE_COOL_DOWN_IN_MS: number = 1000 * 60;

export class ConfirmDeviceUseCase {
    constructor(
        private cacheProvider: ICacheProvider,
        private tokenProvider: ITokenProvider, 
        private authorizeDeviceService: AuthorizeDeviceService // Injeção do novo serviço
    ){}

    async execute(input: inputDTO): Promise<ILoginSucess> {

        const now: Date = new Date();

        if (!input.device_id) throw new AppError("device_id ausente ou inválido", 400, "INVALID_DEVICE_ID");
        if (!input.authorize_device_code) throw new AppError("Código de confirmacao ausente ou invalido", 400, "INVALID_CONFIRMATION_CODE");
        if (!input.user_id) throw new AppError("Id do usuario inexistente ou invalido", 400, "INVALID_USER_ID");
        if (!input.device_name || input.device_name.length > 40) throw new AppError("Nome invalido", 400, "INVALID_NAME");

        const cache_key: string = CacheKeys.User.TEMPORARY_AUTHORIZE_DEVICE_CODE(input.user_id, input.device_id);
        const deviceData: DeviceAuthorizationData | null = await this.cacheProvider.get<DeviceAuthorizationData>(cache_key);

        if(!deviceData){
            throw new AppError("Código de autorização inválido ou expirado.", 401, "INVALID_AUTHORIZATION_CODE");
        }

        if(deviceData.last_time_fetched_at){
            const timeSinceLastFailure: number = now.getTime() - new Date(deviceData.last_time_fetched_at).getTime();
            if(timeSinceLastFailure < ONE_MINUTE_COOL_DOWN_IN_MS){
                throw new AppError(`Aguarde ${Math.floor((ONE_MINUTE_COOL_DOWN_IN_MS - timeSinceLastFailure) / 1000)} segundos para tentar novamente`, 429, "TOO_MANY_REQUESTS");
            }
        }
        
        if(input.authorize_device_code !== deviceData.authorization_code){
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
            throw new AppError("Código incorreto. Tente novamente", 403, "DEVICE_CAN_NOT_BE_AUTHORIZED");
        }

        const user = await this.authorizeDeviceService.execute(input.user_id, input.device_id, input.device_name);

        // Gera a sessão de login (pois a via de e-mail efetua o login no final)
        const tokenVersion: number = Date.now();
        const tokenCacheKey: string = CacheKeys.User.TOKEN_VERSION(user.id);

        await this.cacheProvider.save(tokenCacheKey, tokenVersion.toString(), 86400);

        const token: string = this.tokenProvider.generateToken(
            user.id,
            user.role,
            user.paying_user ? null : user.storeId, 
            user.mustChangePassword,
            tokenVersion,
            user.paying_user 
        );

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