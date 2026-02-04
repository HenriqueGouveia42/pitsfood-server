import type { Request, Response } from "express"
import { LoginIntoStoreUseCase } from "./LoginIntoStoreUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js"

export class LoginIntoStoreController{
    constructor(
        private loginIntoStoreUseCase: LoginIntoStoreUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{
        try{

            const user_id = req.user.id;
            const { store_id_to_login } = req.body;
            const token_version = req.user.token_version;

            const current_store_id = req.user.store_id;

            const { token, user } = await this.loginIntoStoreUseCase.execute({user_id, store_id_to_login, token_version, current_store_id});

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24,
                path: '/'
            })

            return res.status(200).json({
                message: "Usuario vinculado a loja com sucesso",
                user: user
            });

        }catch(error){
            console.log(error)
            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message})
            }
            return res.status(500).json({message:"Erro interno ao tentar logar na loja"})
        }
    }
}