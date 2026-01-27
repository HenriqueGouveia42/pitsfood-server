import type { Request, Response } from "express"
import { ChangePasswordUseCase } from "./ChangePasswordUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";

export class ChangePasswordController {

    constructor(
        private changePasswordUseCase: ChangePasswordUseCase
    ){}

    public handle = async (req: Request, res: Response): Promise<Response> => { // Arrow function para evitar bind

        try{

            const { current_password, new_password } = req.body
            const userId = req.user.id;

            //use case devolve o token pronto
            const { token } = await this.changePasswordUseCase.execute({ 
                current_password, 
                new_password, 
                userId 
            });

            //define o cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24,
                path: '/'
            })

            return res.status(200).json({
                message: "Senha alterada com sucesso. Sua sessão foi renovada."
            })
                
        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.errorCode})
            }

            return res.status(500).json({message: "Erro interno ao mudar a senha"});
        }
            
    }
}