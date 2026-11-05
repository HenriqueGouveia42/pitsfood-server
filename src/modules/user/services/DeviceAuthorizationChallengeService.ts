import { randomInt } from 'node:crypto';
import type { ICacheProvider } from "../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import type { IMailProvider } from '../../../shared/providers/interfaces/emailProvider/IMailProvider.js';
import type { ITokenProvider } from "../providers/interfaces/token.provider.interface.js";
import { CacheKeys } from "../../../shared/constants/cache-keys.js";
import { SYSTEM_NAME } from "../../../config/system_data.js";
import { User, type AuthorizedDeviceProps } from "../entities/user.js";
import { type DeviceAuthorizationData, TEN_MINUTES_IN_SECONDS } from "../useCases/login/LoginUseCase.js";
import { type GetPendingDevicesUseCaseOutputDTO } from '../useCases/deviceUseCases/getPendingDevices/GetPendingDevicesUseCase.js';

export interface IDeviceAuthorizationChallengeService {
    execute(user:User, device_id: string): Promise<string>
}

export class DeviceAuthorizationChallengeService implements IDeviceAuthorizationChallengeService {
    constructor(
        private cacheProvider: ICacheProvider,
        private emailProvider: IMailProvider,
        private tokenProvider: ITokenProvider
    ) {}

    async execute(user: User, device_id: string): Promise<string> {

        const cacheKey: string = CacheKeys.User.TEMPORARY_AUTHORIZE_DEVICE_CODE(user.id, device_id);
        const existingAuthData: AuthorizedDeviceProps | null = await this.cacheProvider.get<AuthorizedDeviceProps>(cacheKey);
        
        if (existingAuthData) {
            const preAuthToken: string = this.tokenProvider.generatePreAuthToken(user.id);
            return preAuthToken
        }

        const authorize_device_code: string = randomInt(100000, 1000000).toString();
        
        const deviceAuthorizationData: DeviceAuthorizationData = {
            authorization_code: authorize_device_code,
            device_id,
            last_time_fetched_at: null,
            failed_attemps: 0
        };

        // 1. Salva o controle da via por e-mail
        await this.cacheProvider.save(cacheKey, deviceAuthorizationData, TEN_MINUTES_IN_SECONDS);

        // 2. Insere o dispositivo na fila para o Gestor (se o usuário for funcionário de uma loja)
        if (user.storeId) {
            const storePendingKey: string = CacheKeys.Store.PENDING_DEVICES(user.storeId);
            let pendingList: GetPendingDevicesUseCaseOutputDTO[] = await this.cacheProvider.get<GetPendingDevicesUseCaseOutputDTO[]>(storePendingKey) || [];
            
            const now: number = Date.now();
            
            // Limpa lixo do cache (requisições > 10 min) e remove duplicatas do mesmo aparelho/usuário
            pendingList = pendingList.filter((req: GetPendingDevicesUseCaseOutputDTO) => 
                (now - req.requested_at < TEN_MINUTES_IN_SECONDS * 1000) &&
                !(req.user_id === user.id && req.device_id === device_id)
            );

            pendingList.push({
                user_id: user.id,
                user_name: user.username,
                device_id: device_id,
                requested_at: now
            });

            await this.cacheProvider.save(storePendingKey, pendingList, TEN_MINUTES_IN_SECONDS);
        }

        // 3. Envia o e-mail normalmente
        const emailTemplateWithDeviceAuthorizationCode: string = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Bem-vindo à ${SYSTEM_NAME}!</h2>
                <p>Use o código abaixo para autorizar seu novo dispositivo:</p>
                <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; width: fit-content;">
                    <strong style="font-size: 24px; letter-spacing: 3px;">${authorize_device_code}</strong>
                </div>
                <p><small>Este código expira em ${TEN_MINUTES_IN_SECONDS/60} minutos.</small></p>
            </div>
        `;

        await this.emailProvider.sendMail({
            to: user.email,
            subject: `Código de autorização (Válido por ${TEN_MINUTES_IN_SECONDS/60} min)`,
            body: emailTemplateWithDeviceAuthorizationCode
        });

        const preAuthToken: string = this.tokenProvider.generatePreAuthToken(user.id)
        
        return preAuthToken
         
    }
}