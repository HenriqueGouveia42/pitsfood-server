import type { Request, Response } from "express";
import { GetOpenBillByGtinCodeUseCase } from "./GetOpenBillByGtinCodeUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class GetOpenBillByGtinCodeController {

    constructor(
        private getOpenBillByGtinCodeUseCase: GetOpenBillByGtinCodeUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response> {

        const { bill_code_gtin } = req.params;
        const store_id = req.user?.store_id;

        if (!bill_code_gtin) {
            throw new AppError("Código (GTIN) da comanda ausente.", 400, "GTIN_CODE_NOT_FOUND");
        }

        if (!store_id) {
            throw new AppError("ID da loja ausente na requisição.", 401, "UNAUTHORIZED");
        }

        const openBillResponseDto = await this.getOpenBillByGtinCodeUseCase.execute(bill_code_gtin, store_id);

        return res.status(200).json(openBillResponseDto);
    }
}