import type { Request, Response } from "express";
import type { GetPhysicalBIllCodesUseCase } from "./GetPhysicalBIllCodesUseCase.js";

export class GetPhysicalBIllCodesController{

    constructor(
        private getPhysicalBIllCodesUseCase: GetPhysicalBIllCodesUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const store_id: string = req.user.store_id;

        const codes = await this.getPhysicalBIllCodesUseCase.execute({ store_id });

        return res.status(200).json(codes);
    }
}