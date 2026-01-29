import type { Request, Response } from "express";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IUserRepository } from "../../repositories/user.repository.interface.js";
import { User } from "../../entities/user.js";

interface IIsLogedInResponse {
    id: string,
    username: string,
    role: string,
    store_id: string | null,
    must_change_password: boolean,
}

export class IsLoggedInController {

    constructor(
        private userRepository: IUserRepository
    ){}

    handle = async(req: Request, res: Response): Promise<Response> =>{

        try{

            const  user_id = req.user.id;

            const user: User | null = await this.userRepository.findSavedUserById(user_id);

            if (!user){
                throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND")
            }

            const response: IIsLogedInResponse = {
                id: user.id,
                username: user.username,
                role: user.role,
                store_id: user.storeId,
                must_change_password: user.mustChangePassword
            }

            return res.status(200).json({message: "Usuario logado", response})

        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }

            return res.status(500).json({message: "Erro interno"})
        }
    
    }
}