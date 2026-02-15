import type { Request, Response } from "express";
import { BatchAddItemsUseCase } from "./batchAddItemsUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";

type product_gtin_quantity = {
    product_gtin: string,
    quantity: number
}

type RequestDTO = {
    bill_code_gtin: string,
    products_gtins_quantities: product_gtin_quantity[]
}

export class BatchAddItemsController  {
    
    constructor(private batchAddItemsUseCase: BatchAddItemsUseCase) {}

    public async handle (req: Request, res: Response): Promise<Response> {

        const user_id = req.user.id;
        const store_id = req.user.store_id;
        
        const { bill_code_gtin, products_gtins_quantities }: RequestDTO = req.body;

        await this.batchAddItemsUseCase.execute({
          bill_code_gtin,
          user_id,
          store_id,
          products_gtins_quantities
        })

        return res.status(200).json({ message: "Itens adicionados com sucesso" })

    }
}