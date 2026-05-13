import type { Request, Response } from "express";
import { GenerateSubscriptionPixUseCase } from "./GenerateSubscriptionPixUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { SubscriptionPlan } from "../../entities/store.js";

interface GeneratePixBodyRequest {
    plan: SubscriptionPlan
}

interface GenereateSubscriptionPixUseCaseDTOResponse {
    payment_url: string,
    amount: number,
    invoice_id: string
}

export class GenerateSubscriptionPixController {

    constructor(
        private generateSubscriptionPixUseCase: GenerateSubscriptionPixUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response> {

        const { plan }: GeneratePixBodyRequest = req.body;

        const user_id = req.user.id;
        const store_id = req.user.store_id;

        const result: GenereateSubscriptionPixUseCaseDTOResponse = await this.generateSubscriptionPixUseCase.execute({
            store_id,
            user_id,
            plan
        });

        return res.status(201).json(result);
    }
}