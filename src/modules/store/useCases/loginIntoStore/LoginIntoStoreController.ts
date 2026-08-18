import type { Request, Response, CookieOptions } from "express";
import { LoginIntoStoreUseCase } from "./LoginIntoStoreUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class LoginIntoStoreController {
    
    constructor(
        private loginIntoStoreUseCase: LoginIntoStoreUseCase
    ){}

    // Helper para gerar as opções do cookie dinamicamente (idêntico ao LoginController)
    private getCookieOptions(maxAge: number): CookieOptions {
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

    public async handle(req: Request, res: Response): Promise<Response> {
       
        if (!req.user) {
            throw new AppError("req.user ausente", 404, "REQ_USER_NOT_FOUND");
        }

        const user_id = req.user.id;
        const token_version = req.user.token_version;
        const current_store_id = req.user.store_id;
        const { store_id_to_login } = req.body;

        // 1. Identifica se o client é Mobile
        const isMobileClient: boolean = req.headers['x-client-type'] === 'mobile';

        const result = await this.loginIntoStoreUseCase.execute({
            user_id,
            store_id_to_login,
            token_version,
            current_store_id
        });
        
        // 2. Se detectou conflito, limpa o cookie corrompido e avisa o front-end
        if (result.status === "CONFLICT_ALREADY_LOGGED_IN") {
            // maxAge 0 para forçar a expiração imediata do cookie no browser
            res.clearCookie('token', this.getCookieOptions(0));
            
            return res.status(409).json({
                message: result.message,
                action: "RELOGIN_REQUIRED" 
            });
        }

        // 3. Caminho de sucesso: extrai o novo token e o user atualizado
        const { token, user } = result.data;

        // 4. Sempre seta o cookie (atende aos browsers)
        res.cookie(
            'token', 
            token, 
            this.getCookieOptions(1000 * 60 * 60 * 24) // 1 dia
        );

        // 5. Prepara a resposta base
        const responsePayload: any = {
            message: "Usuario vinculado a loja com sucesso",
            user: user
        };

        // 6. Injeta o token no JSON apenas se for Mobile
        if (isMobileClient) {
            responsePayload.token = token;
        }

        return res.status(200).json(responsePayload);
    }
}