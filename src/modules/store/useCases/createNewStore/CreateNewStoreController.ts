import type { Request, Response } from "express";
import { CreateNewStoreUseCase } from "./CreateNewStoreUsecase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { Store } from "../../entities/store.js";

export class CreateNewStoreController {

    constructor(
        private createNewStoreUseCase: CreateNewStoreUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response> {
        try {

            const { name, active, cnpj } = req.body;

            
            const created_store: Store = await this.createNewStoreUseCase.execute({
                name,
                active,
                cnpj
            });

            //usamos os GETTERS da entidade, e não o objeto props direto.
            const responseModel = {
                id: created_store.id,
                name: created_store.name,

                //se for undefined, transformamos em null para o JSON exibir
                cnpj: created_store.cnpj ?? null, 
                active: created_store.active,
                created_at: created_store.createdAt,
                updated_at: created_store.updatedAt
            };

            return res.status(201).json(responseModel);

        } catch (error) {

            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, code: error.errorCode });
            }
            
            return res.status(500).json({ message: "Erro Interno ao criar loja" });
        }
    }
}