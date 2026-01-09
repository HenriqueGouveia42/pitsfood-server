import type { Request, Response } from "express"
import { GetOpenBillByGtinCodeUseCase } from "./getOpenBillByGtinCodeUseCase.js"

import { Bill } from "../../entities/bill.js"


export class GetOpenBillByGtinCodeController{

    constructor(
        private getOpenBillByGtinCodeUseCase: GetOpenBillByGtinCodeUseCase
    ) {}

    public async handle (req: Request, res: Response): Promise<Response>{

        try{
            const { bill_code_gtin } = req.params;

            if (!bill_code_gtin){
                throw new Error("gtin_code da comanda ausente")
            }

            const openBill: Bill = await this.getOpenBillByGtinCodeUseCase.execute(bill_code_gtin);

            if(!openBill){
                throw new Error(`Comanda com gtin_code: ${bill_code_gtin} nao encontrada!`);
            }

            return res.status(200).json(openBill);

        }catch(error){
            console.log(error);
            return res.status(400).json({message: "Erro ao buscar comanda aberta"});

        }

    }

}