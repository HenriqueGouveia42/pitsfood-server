import type { Request, Response } from "express";
import type { CreateStoreUseCase } from "./CreateStoreUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class CreateStoreController{
    constructor(
        private createStoreUseCase: CreateStoreUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const { name, cnpj } = req.body;

        const owner_id = req.user.id;

        await this.createStoreUseCase.execute({
            name,
            cnpj,
            owner_id
        })

        return res.status(201).json({message: "Loja criada com sucesso"})

    }
}