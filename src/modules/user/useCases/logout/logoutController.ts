import type { Request, Response } from "express"
import { LogoutUseCase } from "./LogoutUseCase.js"; 
import { AppError } from "../../../../shared/errors/AppError.js";

export class LogoutController{
    constructor(
        private logoutUseCase: LogoutUseCase
    ){}

    public async handle (req: Request, res:Response): Promise<Response> {


        const user_id = req.user.id;

        await this.logoutUseCase.execute({user_id});

        res.cookie('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            expires: new Date(0)
        })
        
        return res.status(200).json({message: "Logout realizado com sucesso", isAuthenticated: false});
    }
}