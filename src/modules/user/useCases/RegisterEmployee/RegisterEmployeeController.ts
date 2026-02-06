import type { Request, Response } from "express";
import { RegisterEmployeeUseCase } from "./RegisterEmployeeUseCase.js";
import type { RegisterEmployeeUseCaseResponse } from "./RegisterEmployeeUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import { UserRole } from "../../entities/user.js";

interface RegisterEmployeeControllerRequest{
    name: string,
    role: UserRole,
    plain_text_password: string,
    email: string,
    store_id: string | null
}

export class RegisterEmployeeController{

    constructor(
        private createUserUseCase: RegisterEmployeeUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

      
        const { name, role, plain_text_password, email }: RegisterEmployeeControllerRequest  = req.body;

        const userId = req.user.id; //userId vem da requisiticao

        if(!name || !role || !plain_text_password || !email || !userId){
            throw new AppError("Algum dado para criar um usuario está faltando", 400, "INVALID_USER_DATA_SENT")
        }

        if (!Object.values(UserRole).includes(role as UserRole)) {
            throw new AppError("Role inválido", 400, "INVALID_USER_ROLE");
        }

        //console.log(name, role, plain_text_password, email, userId);

        const userData: RegisterEmployeeUseCaseResponse = await this.createUserUseCase.execute({name, role, plain_text_password, email, userId});

        return res.status(200).json(userData);

    }
}