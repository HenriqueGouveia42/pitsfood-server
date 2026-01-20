import type { Request, Response } from "express";
import { CreateProductUseCase } from "./createProductUseCase.js"
import { Decimal } from "decimal.js"
import { AppError } from "../../../../shared/errors/AppError.js";

export class CreateProductController{

    constructor(
        private createProductUseCase: CreateProductUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response>{

        try{

            let { name, unit_price_in_reais, gtin_code, is_internal, active } = req.body

            await this.createProductUseCase.execute(
                {
                    name,
                    unit_price_in_reais: new Decimal(unit_price_in_reais),
                    gtin_code,
                    is_internal,
                    active
                })
            
                return res.status(200).json({message: "Produto Criado com sucesso!"})

        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }

            return res.status(500).json({message: "Erro Interno ao criar produto"})
        }

    }

}
