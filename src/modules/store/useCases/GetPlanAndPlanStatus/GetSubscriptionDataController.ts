import type { Request, Response } from "express"
import { GetSubscriptionDataUseCase } from "./GetSubscriptionDataUseCase.js"

import type { useCaseResponseDTO } from "./GetSubscriptionDataUseCase.js"

export class GetSubscriptionDataController{
    
    constructor(
        private getSubscriptionDataUseCase: GetSubscriptionDataUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const store_id: string = req.user.store_id;

        const response: useCaseResponseDTO = await this.getSubscriptionDataUseCase.execute({store_id});

        return res.status(200).json(response)
    }
}