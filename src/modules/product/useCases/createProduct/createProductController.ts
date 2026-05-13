import type { Request, Response } from "express";
import { CreateProductUseCase } from "./createProductUseCase.js"
import { Decimal } from "decimal.js"
import { AppError } from "../../../../shared/errors/AppError.js";

export class CreateProductController{

    constructor(
        private createProductUseCase: CreateProductUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response>{

        let { name, unit_price_in_reais, gtin_code, is_internal, active, track_stock, stock_quantity, requires_preparation } = req.body

        if (typeof(req.user) === 'undefined'){
            throw new AppError("req.user undefined", 500, "REQ_USER_UNDEFINED");
        }
        
        const  store_id: string | undefined  = req.user.store_id;
        const user_id: string | undefined = req.user.id;

        if(!store_id || !user_id){
            throw new AppError("Id da loja ou de usuario invalido", 400, "INVALID_ID");
        }

        const finalStockQuantity = (stock_quantity === undefined || stock_quantity === null) ? 0 : Number(stock_quantity);
               
            
        if (finalStockQuantity !== null && isNaN(finalStockQuantity)) throw new AppError("Quantidade de estoque inválida", 400, "INVALID_NUMBER");

        await this.createProductUseCase.execute(
            {
                name,
                unit_price_in_reais: new Decimal(unit_price_in_reais),
                gtin_code,
                is_internal,
                active,
                store_id,
                track_stock,
                stock_quantity: stock_quantity,
                user_id,
                requires_preparation
            })
            
        return res.status(201).json({message: "Produto Criado com sucesso!"})

    }

}
