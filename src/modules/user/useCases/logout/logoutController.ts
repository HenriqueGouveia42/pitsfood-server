import type { Request, Response } from "express"
import { AppError } from "../../../../shared/errors/AppError.js";

export class LogoutController{
    
    public async handle (req: Request, res:Response): Promise<Response> {

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