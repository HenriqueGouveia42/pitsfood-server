import type { Request, Response } from "express";
import { MakeStockEntryUseCase } from "./MakeStockEntryUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { MakeStockEntryUseCaseResponseDTO } from "./MakeStockEntryUseCase.js"
import type { Decimal } from "decimal.js";


interface MakeStockEntryControllerRequestDTO{
    entry_stock_quantity: number,
    unit_cost: string
}

export class MakeStockEntryController{
    constructor(
        private makeStockEntryUseCase: MakeStockEntryUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const { product_id } = req.params;
        const user_id = req.user.id;
        const store_id = req.user.store_id

        const { entry_stock_quantity, unit_cost }: MakeStockEntryControllerRequestDTO = req.body;

        //await this.makeStockEntryUseCase.execute({user_id, store_id, product_id, entry_stock_quantity, unit_cost});
        const username_that_made_stock_entry:  MakeStockEntryUseCaseResponseDTO = await this.makeStockEntryUseCase.execute({user_id, store_id, product_id, entry_stock_quantity, unit_cost});

        return res.status(200).json({message: `${username_that_made_stock_entry} deu entrada no estoque com sucesso!`});

    }
}