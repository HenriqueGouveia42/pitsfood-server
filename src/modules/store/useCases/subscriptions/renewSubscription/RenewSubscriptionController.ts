import type { Request, Response } from "express";
import { RenewSubscriptionUseCase } from "./RenewSubscriptionUseCase.js";
import { AppError } from "../../../../../shared/errors/AppError.js";

export class RenewSubscriptionController {
    constructor(
        private renewSubscriptionUseCase: RenewSubscriptionUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response> {
        
        const store_id = req.user.store_id;
        const user_id = req.user.id;

        if (!store_id || typeof store_id !== 'string') {
            throw new AppError("Contexto de loja inválido ou ausente.", 400, "INVALID_STORE_CONTEXT");
        }

        // Retorna o resultado (QR Code, Copia e Cola, ID da fatura)
        const result = await this.renewSubscriptionUseCase.execute({ 
            store_id, 
            user_id 
        });

        return res.status(200).json(result);
    }
}