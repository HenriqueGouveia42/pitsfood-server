import type { Request, Response } from "express";
import type { ReactivateItemUseCase } from "./ReactivateItemUsecase.js";
import { AppError } from "../../../../../shared/errors/AppError.js";

export class ReactivateItemController{
    constructor(
        private reactivateItemUseCase: ReactivateItemUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const { bill_id, bill_item_id } = req.params;

        const store_id = req.user?.store_id
        const user_id = req.user?.id

        if(!bill_id || !bill_item_id || !store_id || !user_id) throw new AppError("Parametros insuficientes");
        
        await this.reactivateItemUseCase.execute({
            bill_id,
            bill_item_id,
            store_id,
            user_id
        })

        return res.status(200).json({message: "Item retornado para a comanda com sucesso"});

    }
}