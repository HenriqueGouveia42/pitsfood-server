import type { Request, Response } from "express";
import { LoginIntoStoreUseCase } from "./LoginIntoStoreUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class LoginIntoStoreController {
    constructor(
        private loginIntoStoreUseCase: LoginIntoStoreUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response> {
       
        if (!req.user) {
            throw new AppError("req.user ausente", 404, "REQ_USER_NOT_FOUND");
        }

        const user_id = req.user.id;
        const token_version = req.user.token_version;
        const current_store_id = req.user.store_id;
        const { store_id_to_login } = req.body;

        const result = await this.loginIntoStoreUseCase.execute({
            user_id,
            store_id_to_login,
            token_version,
            current_store_id
        });

        const isProduction = process.env.NODE_ENV === 'production';
        
        // Opções base do cookie para garantir que o clearCookie funcione corretamente
        const cookieOptions = {
            httpOnly: true,
            secure: true, 
            sameSite: isProduction ? 'strict' as const : 'none' as const,
            path: '/'
        };

        // 1. Se detectou conflito, limpa o cookie corrompido e avisa o front-end
        if (result.status === "CONFLICT_ALREADY_LOGGED_IN") {
            res.clearCookie('token', cookieOptions);
            
            return res.status(409).json({
                message: result.message,
                action: "RELOGIN_REQUIRED" // Útil para o front-end saber que deve redirecionar para a tela inicial
            });
        }

        // 2. Caminho de sucesso: sobrescreve o cookie com o novo token
        const { token, user } = result.data;

        res.cookie('token', token, {
            ...cookieOptions,
            maxAge: 1000 * 60 * 60 * 24 // 1 dia
        });

        return res.status(200).json({
            message: "Usuario vinculado a loja com sucesso",
            user: user
        });
    }
}