import type { Request, Response } from "express";
import { GenerateSubscriptionPixUseCase } from "./GenerateSubscriptionPixUseCase.js";
import { SubscriptionPlan } from "../../entities/store.enums.js";
import { AppError } from "../../../../shared/errors/AppError.js";

interface GeneratePixBodyRequest {
    plan: SubscriptionPlan
}

interface GenerateSubscriptionPixUseCaseDTOResponse {
    br_code: string;
    br_code_base64: string;
    amount: number;
    invoice_id: string;
}

export class GenerateSubscriptionPixController {

    constructor(
        private generateSubscriptionPixUseCase: GenerateSubscriptionPixUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response> {

        const { plan }: GeneratePixBodyRequest = req.body;

        if (!req.user || !req.user.id || !req.user.store_id) throw new AppError("Requisicao invalida", 500, "INVALID_TYPE");

        const user_id = req.user.id;
        const store_id = req.user.store_id;

        if (typeof(store_id) !== 'string') throw new AppError("Tipo incorreto na requisicao", 500, "INVALID_TYPE")

        const result: GenerateSubscriptionPixUseCaseDTOResponse = await this.generateSubscriptionPixUseCase.execute({
            store_id,
            user_id,
            plan
        });

        return res.status(201).json(result);
    }
}