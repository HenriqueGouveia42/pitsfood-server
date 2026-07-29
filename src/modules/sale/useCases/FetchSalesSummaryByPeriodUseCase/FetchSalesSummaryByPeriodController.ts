import type { Request, Response } from "express";
import { FetchSalesSummaryByPeriodUseCase } from "./FetchSalesSummaryByPeriodUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class FetchSalesSummaryByPeriodController {

    constructor(
        private fetchSalesSummaryByPeriodUseCase: FetchSalesSummaryByPeriodUseCase
    ){}

    async handle(req: Request, res: Response): Promise<Response>{
        
        const { startDate, endDate } = req.query;

        const store_id: string | null | undefined = req.user.store_id;

        if (!store_id) throw new AppError("Falta o id da loja")

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        const result = await this.fetchSalesSummaryByPeriodUseCase.execute({
            startDate: start,
            endDate: end,
            store_id: store_id
        });

        if (result.status === "completed") {
            return res.status(200).json(result.data);
        }

        if (result.status === "failed"){
            return res.status(422).json({
                message: result.message || "Erro ao processar relatório. Tente novamente.",
                status: "failed"
            })
        }

        return res.status(202).json({
            message: "Relatório solicitado com sucesso. Processamento em segundo plano.",
            jobId: result.jobId,
            status: "processing"
        });
    }
}