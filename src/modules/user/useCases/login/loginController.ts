import type { Request, Response } from "express"
import { LoginUseCase } from "./loginUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import type { LoginResult } from "./loginUseCase.js";
import type { CookieOptions } from "express";

export class LoginController {

    constructor(
        private loginUseCase: LoginUseCase
    ) {}

    // Helper para gerar as opções do cookie dinamicamente
    private getCookieOptions(maxAge: number): CookieOptions {
        const isProd = process.env.NODE_ENV === 'production';
        return {
            httpOnly: true,
            secure: true, // Obrigatório para SameSite 'none' (O Chrome aceita true no localhost tranquilamente)
            sameSite: 'none', // Obrigatório pois Front (localhost/Vercel) e Back (Ngrok/Render) estão em domínios diferentes
            maxAge,
            path: '/'
        };
    }

    handle = async(req: Request, res: Response): Promise<Response> => {

        const { email, password } = req.body;
        const device_id = req.headers['x-device-id'] as string;

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

            return res.status(200).json({
                message: "Autorize o dispositivo com o codigo enviado por email"
            })
        }

        if (loginResult.status === "SUCCESS"){

            res.cookie(
                'token', 
                loginResult.data.token, 
                this.getCookieOptions(1000 * 60 * 60 * 24) // 1 dia
            );

            return res.status(200).json({
                message: "Login realizado com sucesso",
                user: loginResult.data.user
            });
        }

        throw new AppError("Resposta Inusitada", 500, "WEIRD_RESPONSE")
    }
}