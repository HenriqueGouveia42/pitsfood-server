import type { Request, Response } from "express";
import { UserCreatesAnotherUserUseCase } from "./UserCreatesAnotherUserUseCase.js";
import type { UserCreatesAnotherUserUseCaseResponse } from "./UserCreatesAnotherUserUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import { UserRole } from "../../entities/user.js";

interface CreateUserControllerRequest{
    name: string,
    role: string,
    plain_text_password: string,
    email: string,
    store_id: string
}

export class UserCreatesAnotherUserController{

    constructor(
        private createUserUseCase: UserCreatesAnotherUserUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

       try{
            const { name, role, plain_text_password, email }: CreateUserControllerRequest  = req.body;

            const store_id = req.user.store_id; //store_id vem da requisicao, ou seja, apenas um usuario ja logado vai poder usar esse controler - CASO DO GESTOR QUE CRIA OUTROS USUARIOS PARA A SUA LOJA!!!

            if(!name || !role || !plain_text_password || !store_id || !email){
                throw new AppError("Algum dado para criar um usuario está faltando", 400, "INVALID_USER_DATA_SENT")
            }

            if (!Object.values(UserRole).includes(role as UserRole)) {
                throw new AppError("Role inválido", 400, "INVALID_USER_ROLE");
            }

            const userData: UserCreatesAnotherUserUseCaseResponse = await this.createUserUseCase.execute({name, role, plain_text_password, store_id, email});

            return res.status(200).json(userData);

        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }
            return res.status(500).json({message: "Erro interno"})
       }
        
    }
}