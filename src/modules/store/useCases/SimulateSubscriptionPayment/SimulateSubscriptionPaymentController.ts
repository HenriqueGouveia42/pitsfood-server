import type { Request, Response } from "express";
import { SimulateSubscriptionPaymentUseCase } from "./SimulateSubscriptionPaymentUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class SimulateSubscriptionPaymentController {
    constructor(
        private simulateSubscriptionPaymentUseCase: SimulateSubscriptionPaymentUseCase
    ) {}

    async handle(req: Request, res: Response): Promise<Response> {
        if (!req.user || !req.user.store_id) {
            throw new AppError("Requisição inválida", 500, "INVALID_TYPE");
        }

        const { invoice_id } = req.body;
        const store_id = req.user.store_id;

        if (!invoice_id) {
            throw new AppError("O ID da fatura interna é obrigatório.", 400, "INVOICE_ID_REQUIRED");
        }

        await this.simulateSubscriptionPaymentUseCase.execute({ invoice_id, store_id });

        return res.status(200).json({ success: true });
    }
}