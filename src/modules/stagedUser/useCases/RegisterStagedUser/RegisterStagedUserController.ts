import type { Request, Response } from "express";
import { RegisterStagedUserUseCase } from "./RegisterStagedUserUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class RegisterStagedUserController {

    constructor(
        private registerStagedUserUseCase: RegisterStagedUserUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response>{

        const { email, username, password } = req.body

        await this.registerStagedUserUseCase.execute({
            email,
            username,
            password
        })
            
        return res.status(200).json({message: "Usuario staged criado com sucesso e codigo enviado por email"})

    }

}