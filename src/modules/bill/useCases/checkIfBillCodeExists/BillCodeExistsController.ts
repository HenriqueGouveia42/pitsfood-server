import type { Request, Response } from "express";
import { BillCodeExistsUseCase } from "./BillCodeExistsUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";

interface BillCode{
    bill_code_gtin: string
}

export class BillCodeExistsController{

    constructor(
        private billCodeExistsUseCase: BillCodeExistsUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

      
        const { bill_code_gtin } = req.params;

        if(!bill_code_gtin){
            throw new AppError("Codigo GTIN da comanda ausente", 400, "GTIN_CODE_NOT_FOUND");
        }

        const billExists: boolean = await this.billCodeExistsUseCase.execute({ bill_code_gtin });

        if(!billExists){
            throw new AppError(`Comanda com o codigo: ${bill_code_gtin} nao existe`, 404, "BILL_NOT_FOUND")
        }

        return res.status(200).json({message: "Comanda existe no sistema!"});

    
    }
}