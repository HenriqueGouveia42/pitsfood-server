import type { Request, Response } from "express";
import { CreateProductUseCase } from "./createProductUseCase.js"
import { Decimal } from "decimal.js"

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
            console.log(error);
            return res.status(400).json({message: "Erro ao criar produto"})
        }

    }

}
