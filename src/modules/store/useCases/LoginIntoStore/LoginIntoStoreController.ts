import type { Request, Response } from "express"
import { LoginIntoStoreUseCase } from "./LoginIntoStoreUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js"

export class LoginIntoStoreController{
    constructor(
        private loginIntoStoreUseCase: LoginIntoStoreUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{
       

        const user_id = req.user.id;
        const { store_id_to_login } = req.body;
        const token_version = req.user.token_version;

        const current_store_id = req.user.store_id;

        const { token, user } = await this.loginIntoStoreUseCase.execute({user_id, store_id_to_login, token_version, current_store_id});

        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, 
            sameSite: isProduction ? 'strict' : 'none',
            maxAge: 1000 * 60 * 60 * 24,
            path: '/'
        });

        return res.status(200).json({
            message: "Usuario vinculado a loja com sucesso",
            user: user
        });

       
    }
}