import type { Request, Response } from "express";
import { RenewSubscriptionUseCase } from "./RenewSubscriptionUseCase.js";

export class RenewSubscriptionController{
    constructor(
        private renewSubscriptionUseCase: RenewSubscriptionUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{
        
        const store_id: string = req.user.store_id;

        await this.renewSubscriptionUseCase.execute({store_id});

        return res.status(200).json({message: "Plano renovado com sucesso"})
    }
}

