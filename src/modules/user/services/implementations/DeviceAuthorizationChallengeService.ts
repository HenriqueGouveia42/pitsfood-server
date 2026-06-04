// DeviceAuthorizationChallengeService.ts
import { randomInt } from 'node:crypto';
import type { IDeviceAuthorizationChallengeService } from '../interfaces/IDeviceAuthorizationChallengeService.js';
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import type { IMailProvider } from "../../../../shared/providers/EmailProvider/interface/IMailProvider.js";
import type { ITokenProvider } from "../../providers/interfaces/token.provider.interface.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import { SYSTEM_NAME } from "../../../../config/system_data.js";
import { User, type AuthorizedDeviceProps } from "../../entities/user.js";
import { type LoginResult, type DeviceAuthorizationData, TEN_MINUTES_IN_SECONDS } from "../../useCases/login/loginUseCase.js"; // Ajuste os imports

export class DeviceAuthorizationChallengeService implements IDeviceAuthorizationChallengeService {
    constructor(
        private cacheProvider: ICacheProvider,
        private emailProvider: IMailProvider,
        private tokenProvider: ITokenProvider
    ) {}

    async execute(user: User, device_id: string): Promise<LoginResult> {
        const cacheKey: string = CacheKeys.User.TEMPORARY_AUTHORIZE_DEVICE_CODE(user.id, device_id);
        const existingAuthData: AuthorizedDeviceProps | null = await this.cacheProvider.get<AuthorizedDeviceProps>(cacheKey);
        
        if (existingAuthData) {
            const preAuthToken: string = this.tokenProvider.generatePreAuthToken(user.id);
            return {
                status: "DEVICE_CONFIRMATION_REQUIRED",
                data: { pre_auth_token: preAuthToken }
            };
        }

        const authorize_device_code: string = randomInt(100000, 1000000).toString();
        
        const deviceAuthorizationData: DeviceAuthorizationData = {
            authorization_code: authorize_device_code,
            device_id,
            last_time_fetched_at: null,
            failed_attemps: 0
        };

        await this.cacheProvider.save(cacheKey, deviceAuthorizationData, TEN_MINUTES_IN_SECONDS);

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
            subject: `Código para autorização de dispositivo válido por até ${TEN_MINUTES_IN_SECONDS/60} minutos`,
            body: emailTemplateWithDeviceAuthorizationCode
        });

        const preAuthToken: string = this.tokenProvider.generatePreAuthToken(user.id);
        
        return {
            status: "DEVICE_CONFIRMATION_REQUIRED",
            data: { pre_auth_token: preAuthToken }
        };
    }
}