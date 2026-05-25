import type { Request, Response } from "express";
import { MakeStockEntryUseCase } from "./MakeStockEntryUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { MakeStockEntryUseCaseResponseDTO } from "./MakeStockEntryUseCase.js"

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

        if(!req.user){
            throw new AppError("req.user undefined", 500, "REQ_USER_UNDEFINED")
        }
        if(!req.user.store_id){
            throw new AppError("req.user.store_id undefined");
        }
        const user_id: string = req.user.id;
        const store_id: string = req.user.store_id

        const { entry_stock_quantity, unit_cost }: MakeStockEntryControllerRequestDTO = req.body;

        const username_that_made_stock_entry:  MakeStockEntryUseCaseResponseDTO = await this.makeStockEntryUseCase.execute({user_id, store_id, product_id, entry_stock_quantity, unit_cost});

        return res.status(200).json({message: `${username_that_made_stock_entry} deu entrada no estoque com sucesso!`});

    }
}