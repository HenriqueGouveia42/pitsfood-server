import type { Request, Response } from "express";
import { FindAllOpenBillsUseCase } from "./FindAllOpenBillsUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { billStates } from "../../entities/bill.js";

interface BillItemDTO {
    name: string;
    unit_price_at_sold: number;
    gtin_code: string;
    quantity: number;
    total: number;
}

interface BillDTO{
    bill_code_gtin: string;
    status: billStates;
    products: BillItemDTO[];
}

export class FindAllOpenBillsController{
    
    constructor(
        private findAllOpenBillsUseCase: FindAllOpenBillsUseCase
    ) {}

    public async handle(req: Request, res: Response ): Promise<Response>{

        try{

            const openBills: BillDTO[] = await this.findAllOpenBillsUseCase.execute();

            return res.status(200).json(openBills);

        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }
            return res.status(400).json({message: "Erro"})

        }
    }
}