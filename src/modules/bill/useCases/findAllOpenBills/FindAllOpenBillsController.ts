import type { Request, Response } from "express";
import { FindAllOpenBillsUseCase } from "./FindAllOpenBillsUseCase.js";

export class FindAllOpenBillsController {
    
    constructor(
        private findAllOpenBillsUseCase: FindAllOpenBillsUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response> {
        
        const store_id = req.user.store_id;

        const openBills = await this.findAllOpenBillsUseCase.execute(store_id);

        return res.status(200).json(openBills);
    }
}