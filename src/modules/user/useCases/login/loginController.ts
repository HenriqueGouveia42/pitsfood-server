import type { Request, Response } from "express"
import { LoginUseCase } from "./loginUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";

export class LoginController {

    constructor(private loginUseCase: LoginUseCase) {}

    handle = async(req: Request, res: Response): Promise<Response> =>{

        try{

            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: "Username e password são obrigatórios." });
            }

            const { token, user } = await this.loginUseCase.execute({
                username,
                password
            })

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24,
                path: '/'
            })


            return res.status(200).json({
                message: "Login realizado com sucesso",
                user: user
            });

        }catch(error){

            console.log(error);

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }

            return res.status(500).json({message: "Erro ao logar"})
        }
    }
}