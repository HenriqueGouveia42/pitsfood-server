import type { Request, Response } from "express"
import { GetPlanAndPlanStatusUseCase } from "./GetPlanAndPlanStatusUseCase.js"

import type { useCaseResponseDTO } from "./GetPlanAndPlanStatusUseCase.js"

export class GetPlanAndPlanStatusController{
    
    constructor(
        private getPlanAndPlanStatusUseCase: GetPlanAndPlanStatusUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const store_id: string = req.user.store_id;

        const response: useCaseResponseDTO = await this.getPlanAndPlanStatusUseCase.execute({store_id});

        return res.status(200).json(response)
    }
}