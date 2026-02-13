import type { Request, Response } from "express";
import { BatchAddItemsUseCase } from "./batchAddItemsUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";

export class BatchAddItemsController  {
    
    constructor(private batchAddItemsUseCase: BatchAddItemsUseCase) {}

    public async handle (req: Request, res: Response): Promise<Response> {

        const user_id = req.user.id;
        const store_id = req.user.store_id;
        
        const { bill_code, products_ids } = req.body;

        await this.batchAddItemsUseCase.execute({
            bill_code_gtin: bill_code,
            user_id: user_id,
            store_id: store_id,
            products_ids: products_ids
        })

        return res.status(200).json({ message: "Itens adicionados com sucesso" })

    }
}