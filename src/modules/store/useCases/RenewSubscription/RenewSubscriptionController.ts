import type { Request, Response } from "express";
import { RenewSubscriptionUseCase } from "./RenewSubscriptionUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class RenewSubscriptionController{
    constructor(
        private renewSubscriptionUseCase: RenewSubscriptionUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{
        
        const store_id: string | null | undefined = req.user.store_id;

        if (!store_id) throw new AppError("'store_id' ausente");

        const user_id: string = req.user.id;

        await this.renewSubscriptionUseCase.execute({store_id, user_id});

        return res.status(200).json({message: "Plano renovado com sucesso"})
    }
}

