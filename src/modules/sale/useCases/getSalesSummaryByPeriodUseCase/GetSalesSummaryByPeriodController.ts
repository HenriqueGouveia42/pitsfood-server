import type { Request, Response } from "express";
import { GetSalesSummaryByPeriodUseCase } from "./GetSalesSummaryByPeriodUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class GetSalesSummaryByPeriodController {

    constructor(
        private getSalesSummaryByPeriodUseCase: GetSalesSummaryByPeriodUseCase
    ){}

    async handle(req: Request, res: Response): Promise<Response>{
        
        try{

            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                throw new AppError("'startDate' e 'endDate' sao obrigatorios", 400, "INVALID_PARAMS");
            }

            const start = new Date(startDate as string);
            const end = new Date(endDate as string);

            const summary = await this.getSalesSummaryByPeriodUseCase.execute({
                startDate: start,
                endDate: end
            });

            return res.status(200).json(summary);

        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }

            return res.status(500).json({message: "Erro Interno ao gerar relatório"})

        }

    }
}