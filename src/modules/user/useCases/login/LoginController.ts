import { AppError } from "../../../../shared/errors/AppError.js";
import type { ILoginUseCase, LoginUseCaseOutputDTO } from "./LoginUseCase.js";

import type { 
    IController, 
    IHttpRequest, 
    IHttpResponse, 
    ICookieOptions 
} from "../../../../shared/infra/http/protocols.js"

export type LoginControllerInputDTO = {
    email: string;
    password: string;
}

export class LoginController implements IController {

    constructor(
        private readonly loginUseCase: ILoginUseCase
    ) {}

    private getCookieOptions(maxAge: number): ICookieOptions {
        const isCrossDomain = 
            process.env.NODE_ENV === 'production' || 
            process.env.USING_TUNNEL === 'true';

        return {
            httpOnly: true,
            secure: isCrossDomain, 
            sameSite: isCrossDomain ? 'none' : 'lax', 
            maxAge,
            path: '/'
        };
    }

    handle = async (req: IHttpRequest<LoginControllerInputDTO>): Promise<IHttpResponse> => {

        const { email, password } = req.body as LoginControllerInputDTO;
        const device_id = req.headers?.['x-device-id'] as string;
        const isMobileClient = req.headers?.['x-client-type'] === 'mobile';

        const loginResult: LoginUseCaseOutputDTO = await this.loginUseCase.execute({
            email,
            password,
            device_id
        });

        if (loginResult.status === "DEVICE_CONFIRMATION_REQUIRED"){
            
            const responsePayload: any = {
                message: "Autorize o dispositivo com o codigo enviado por email"
            };

            if(isMobileClient) {
                responsePayload.pre_auth_token = loginResult.data.pre_auth_token;
            }

            // 7. Retornamos o objeto instruindo o adapter a setar o cookie e enviar o JSON
            return {
                statusCode: 200,
                body: responsePayload,
                cookies: [
                    {
                        name: 'pre_auth_token',
                        value: loginResult.data.pre_auth_token,
                        options: this.getCookieOptions(1000 * 60 * 10)
                    }
                ]
            };
        }

        if (loginResult.status === "SUCCESS"){

            const responsePayload: any = {
                message: "Login realizado com sucesso",
                user: loginResult.data.user
            };

            // Se for um client mobile, precisamos retornar o token na resposta, pois o mobile não lida bem com cookies http only
            if(isMobileClient){
                responsePayload.token = loginResult.data.token;
            }

            return {
                statusCode: 200,
                body: responsePayload,
                cookies: [
                    {
                        name: 'token',
                        value: loginResult.data.token,
                        options: this.getCookieOptions(1000 * 60 * 60 * 24)
                    }
                ]
            };
        }

        throw new AppError("Resposta Inusitada", 500, "WEIRD_RESPONSE");
    }
}