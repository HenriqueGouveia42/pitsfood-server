import type { Request, Response } from "express"
import { AppError } from "../../../../shared/errors/AppError.js";

export class LogoutController{
    
    public async handle (req: Request, res:Response): Promise<Response> {

        res.clearCookie('token', {
            httpOnly: true,
            secure: true,      
            sameSite: 'none',  
            path: '/'
        });

        res.clearCookie('pre_auth_token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
        });
        
        return res.status(200).json({message: "Logout realizado com sucesso", isAuthenticated: false});
    }
}