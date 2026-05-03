import type { Request, Response } from "express";
import { GetSalesSummaryByPeriodUseCase } from "./GetSalesSummaryByPeriodUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class GetSalesSummaryByPeriodController {

    constructor(
        private getSalesSummaryByPeriodUseCase: GetSalesSummaryByPeriodUseCase
    ){}

    async handle(req: Request, res: Response): Promise<Response>{
        
        const { startDate, endDate } = req.query;

        console.log(`controller: ${startDate} - ${endDate}`)

        const store_id: string = req.user.store_id;

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        const summary = await this.getSalesSummaryByPeriodUseCase.execute({
            startDate: start,
            endDate: end,
            store_id: store_id
        });

        //console.log(summary);

        return res.status(200).json(summary);

    }
}