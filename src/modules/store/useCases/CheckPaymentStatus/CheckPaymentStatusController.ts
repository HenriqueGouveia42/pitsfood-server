import type { Request, Response } from "express";
import { CheckPaymentStatusUseCase } from "./CheckPaymentStatusUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class CheckPaymentStatusController {
    constructor(
        private checkPaymentStatusUseCase: CheckPaymentStatusUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response> {
        
        // ID da fatura vem pela URL: /check-payment-status/:invoice_id
        const { invoice_id } = req.params;
        
        // store_id vem do token JWT interceptado pelo middleware (conforme a tipagem Express.Request enviada)
        const store_id = req.user?.store_id;

        if (!invoice_id) {
            throw new AppError("O ID da fatura é obrigatório.", 400, "MISSING_INVOICE_ID");
        }

        if (!store_id || typeof store_id !== 'string') {
            throw new AppError("Loja não identificada na requisição.", 401, "UNAUTHORIZED_STORE");
        }

        const statusData = await this.checkPaymentStatusUseCase.execute({
            invoice_id,
            store_id
        });

        return res.status(200).json(statusData);
    }
}