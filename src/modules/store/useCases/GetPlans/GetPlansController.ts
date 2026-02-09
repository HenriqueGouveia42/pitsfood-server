import type { Request, Response } from "express";
import type { GetPlansUseCase } from "./GetPlansUseCase.js";

export class GetPlansController{
    constructor(
        private getPlansUseCase: GetPlansUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const response = await this.getPlansUseCase.execute();

        return res.status(200).json(response);
    }
}