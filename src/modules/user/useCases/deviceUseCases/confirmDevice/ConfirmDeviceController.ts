import { AppError } from "../../../../../shared/errors/AppError.js";
import type { ConfirmDeviceUseCase } from "./ConfirmDeviceUseCase.js";
import type { 
    IController, 
    IHttpRequest, 
    IHttpResponse, 
    ICookieOptions 
} from "../../../../../shared/infra/http/protocols.js";

export type ConfirmDeviceControllerInputDTO = {
    code: string;
    device_name?: string;
};

export class ConfirmDeviceController implements IController {
    
    constructor(
        private readonly confirmDeviceUseCase: ConfirmDeviceUseCase,
        private readonly isCrossDomain: boolean
    ) {}

    private getCookieOptions(maxAge?: number): ICookieOptions {
        return {
            httpOnly: true,
            secure: this.isCrossDomain,
            sameSite: this.isCrossDomain ? 'none' : 'lax',
            path: '/',
            ...(maxAge !== undefined && { maxAge }) // Só adiciona maxAge se for passado
        };
    }

    handle = async (req: IHttpRequest<ConfirmDeviceControllerInputDTO>): Promise<IHttpResponse> => {
        
        const user_id = req.preAuthUserId;
        const isMobileClient: boolean = (req.headers?.['x-client-type'] as string) === 'mobile';
        
        if (!user_id) {
            throw new AppError("Acesso negado. Token de pré-autorização ausente.", 401, "PRE_AUTH_MISSING");
        }

        let { code, device_name } = req.body || {};
        
        const device_id = req.headers?.['x-device-id'] as string;
        
        if (!device_id) {
            throw new AppError("A identificação do dispositivo (x-device-id) é obrigatória.", 400, "MISSING_DEVICE_ID");
        }

        // Aplica o fallback para o user-agent e limita a 40 caracteres
        const userAgent = (req.headers?.['user-agent'] as string) || "Dispositivo Desconhecido";
        device_name = (device_name || userAgent).substring(0, 40);

        const { token, user } = await this.confirmDeviceUseCase.execute({
            user_id,
            device_id,
            authorize_device_code: code as string,
            device_name
        });

        const responsePayload: any = {
            message: "Dispositivo autorizado e login realizado com sucesso",
            user: user
        };

        if (isMobileClient) {
            responsePayload.token = token;
        }
        
        return {
            statusCode: 200,
            body: responsePayload,
            cookies: [
                {
                    // Apaga o cookie temporário
                    name: 'pre_auth_token',
                    value: '', 
                    options: { ...this.getCookieOptions(), maxAge: 0 } 
                },
                {
                    // Planta o cookie definitivo
                    name: 'token',
                    value: token,
                    options: this.getCookieOptions(1000 * 60 * 60 * 24) // 1 dia
                }
            ]
        };
    }
}