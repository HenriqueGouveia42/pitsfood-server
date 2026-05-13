import type { Request, Response } from "express"
import { GetOpenBillByGtinCodeUseCase } from "./getOpenBillByGtinCodeUseCase.js"
import type { GetOpenBillResponseDTO } from "./getOpenBillByGtinCodeUseCase.js"

import { Bill } from "../../entities/bill.js"
import { AppError } from "../../../../shared/errors/AppError.js";


export class GetOpenBillByGtinCodeController{

    constructor(
        private getOpenBillByGtinCodeUseCase: GetOpenBillByGtinCodeUseCase
    ) {}

    public async handle (req: Request, res: Response): Promise<Response>{

        
        const { bill_code_gtin } = req.params;
        if (!bill_code_gtin){
            throw new AppError("gtin_code da comanda ausente", 400, "GTIN_CODE_NOT_FOUND")
        }

        const openBillResponseDto: GetOpenBillResponseDTO = await this.getOpenBillByGtinCodeUseCase.execute(bill_code_gtin);

        if(!openBillResponseDto){
            throw new AppError(`Comanda com gtin_code: ${bill_code_gtin} nao encontrada!`, 404, "BILL_NOT_FOUND")
        }

        return res.status(200).json(openBillResponseDto);
    }

}