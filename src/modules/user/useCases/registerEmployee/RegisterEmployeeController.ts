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
    store_id: string | null,
    cpf_cnpj: string | null | undefined,
    phone: string | null
}

export class RegisterEmployeeController{

    constructor(
        private createUserUseCase: RegisterEmployeeUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

      
        const { name, role, plain_text_password, email, cpf_cnpj, phone }: RegisterEmployeeControllerRequest  = req.body;

        const userId = req.user?.id;
        const store_id = req.user?.store_id;
        
        if(!name || !role || !plain_text_password || !email || !userId ){
            throw new AppError("Algum dado para criar um usuario está faltando", 400, "INVALID_USER_DATA_SENT")
        }

        if (!Object.values(UserRole).includes(role as UserRole)) {
            throw new AppError("Role inválido", 400, "INVALID_USER_ROLE");
        }

        const userData: RegisterEmployeeUseCaseResponse = await this.createUserUseCase.execute({name, role, plain_text_password, email, userId, cpf_cnpj, phone, target_store_id: store_id});

        return res.status(200).json(userData);

    }
}