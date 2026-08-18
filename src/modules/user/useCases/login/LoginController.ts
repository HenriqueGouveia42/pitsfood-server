import type { Request, Response } from "express"
import { LoginUseCase } from "./LoginUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import type { LoginResult } from "./LoginUseCase.js";
import type { CookieOptions } from "express";

export class LoginController {

    constructor(
        private loginUseCase: LoginUseCase
    ) {}

    // Helper para gerar as opções do cookie dinamicamente
    private getCookieOptions(maxAge: number): CookieOptions {
    // Verifica se estamos em produção OU usando um túnel HTTPS local como o Ngrok
    const isCrossDomain = 
        process.env.NODE_ENV === 'production' || 
        process.env.USING_TUNNEL === 'true';

    return {
        httpOnly: true,
        // Se for domínios diferentes (Vercel ou Ngrok), secure é OBRIGATÓRIO
        secure: isCrossDomain, 
        // Se for domínios diferentes, obriga 'none'. Se for puramente local (ex: sem ngrok), usa 'lax'
        sameSite: isCrossDomain ? 'none' : 'lax', 
        maxAge,
        path: '/'
    };
}

    handle = async(req: Request, res: Response): Promise<Response> => {

        const { email, password } = req.body;
        const device_id = req.headers['x-device-id'] as string;

        const isMobileClient: boolean = req.headers['x-client-type'] === 'mobile';

        const loginResult: LoginResult = await this.loginUseCase.execute({
            email,
            password,
            device_id
        })

        if (loginResult.status === "DEVICE_CONFIRMATION_REQUIRED"){
            
            res.cookie(
                'pre_auth_token', 
                loginResult.data.pre_auth_token, 
                this.getCookieOptions(1000 * 60 * 10) // 10 minutos
            );

            const responsePayload: any = {
                message: "Autorize o dispositivo com o codigo enviado por email"
            };

            if(isMobileClient) {
                responsePayload.pre_auth_token = loginResult.data.pre_auth_token;
            }

            return res.status(200).json(responsePayload)
        }

        if (loginResult.status === "SUCCESS"){

            res.cookie(
                'token', 
                loginResult.data.token, 
                this.getCookieOptions(1000 * 60 * 60 * 24) // 1 dia
            );

            const responsePayload: any = {
                message: "Login realizado com sucesso",
                user: loginResult.data.user
            }

            if(isMobileClient){
                responsePayload.token = loginResult.data.token;
            }

            return res.status(200).json(responsePayload);
        }

        throw new AppError("Resposta Inusitada", 500, "WEIRD_RESPONSE")
    }
}