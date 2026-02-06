import type { Request, Response } from "express";
import { GenerateSubscriptionPixUseCase } from "./GenerateSubscriptionPixUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { SubscriptionPlan } from "../../entities/store.js";

interface GeneratePixBodyRequest {
    plan: SubscriptionPlan
}

export class GenerateSubscriptionPixController {

    constructor(
        private generateSubscriptionPixUseCase: GenerateSubscriptionPixUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response> {

        const { plan }: GeneratePixBodyRequest = req.body;

        const user_id = req.user.id;
        const store_id = req.user.store_id;

        //validações básicas de entrada
        if (!plan) {
            throw new AppError("O plano é obrigatório para gerar o pagamento.", 400, "MISSING_PLAN");
        }

        if (!user_id) {
            throw new AppError("Usuário não autenticado corretamente.", 401, "USER_AUTH_ERROR");
        }

        if (!store_id) {
            throw new AppError("É necessário estar logado em uma loja para gerar a assinatura.", 403, "STORE_CONTEXT_REQUIRED");
        }

        //validação se o plano enviado existe no Enum
        if (!Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan)) {
            throw new AppError("Plano inválido.", 400, "INVALID_PLAN_TYPE");
        }

        const result = await this.generateSubscriptionPixUseCase.execute({
            store_id,
            user_id,
            plan
        });

        return res.status(201).json(result);
    }
}