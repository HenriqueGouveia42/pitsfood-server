import type { Request, Response } from "express"
import { GetPaginatedSalesUsecase } from "./GetPaginatedSalesUsecase.js";
import type { GetPaginatedSalesUsecaseOutputDTO } from "./GetPaginatedSalesUsecase.js";

export class GetPaginatedSalesController{
    constructor(
        private getPaginatedSalesUsecase: GetPaginatedSalesUsecase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const store_id: string = req.user.store_id;
        
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 15;

        const response: GetPaginatedSalesUsecaseOutputDTO = await this.getPaginatedSalesUsecase.execute({
            store_id,
            page,
            limit
        });

        return res.status(200).json(response);
    }
}