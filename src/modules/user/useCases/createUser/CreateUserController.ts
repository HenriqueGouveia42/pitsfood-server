import type { Request, Response } from "express";
import { CreateUserUseCase } from "./CreateUserUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { CreateUserUseCaseResponse } from "./CreateUserUseCase.js"
import { UserRole } from "../../entities/user.js";

interface CreateUserControllerRequest{
    name: string,
    role: string,
    plain_text_password: string
}

export class CreateUserController{

    constructor(
        private createUserUseCase: CreateUserUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

       try{
            const { name, role, plain_text_password } = req.body;

            if(!name || !role || !plain_text_password){
                throw new AppError("Algum dado para criar um usuario está faltando", 400, "INVALID_USER_DATA_SENT")
            }

            if (role != UserRole.CAIXA && role != UserRole.GESTOR && role != UserRole.VENDEDOR){
                throw new AppError("Role invalido", 400, "INVALID_USER_ROLE")
            }

            const userData: CreateUserUseCaseResponse = await this.createUserUseCase.execute({name, role, plain_text_password});

            return res.status(200).json(userData);

        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }
            return res.status(500).json({message: "Erro interno"})
       }
        
    }
}