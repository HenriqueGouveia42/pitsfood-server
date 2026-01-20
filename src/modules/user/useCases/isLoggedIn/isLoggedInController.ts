import type { Request, Response } from "express";
import { AppError } from "../../../../shared/errors/AppError.js";

export class IsLoggedInController {

    constructor(){}

    handle = async(req: Request, res: Response): Promise<Response> =>{

        try{

            const { id, role } = req.user;

            return res.status(200).json({
                isAuthenticated: true,
                user: {
                    id: id,
                    role: role
                }
            })

        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }

            return res.status(500).json({message: "Erro interno"})
        }
    
    }
}