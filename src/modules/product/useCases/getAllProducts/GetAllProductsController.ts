import type { Request, Response } from "express";
import { GetAllProductsUseCase } from "./GetAllProductsUseCase.js";
import type { IGetAllProductsResponse } from "./GetAllProductsUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";

export class GetAllProductsController{

    constructor(
        private getAllActiveProductsUseCase: GetAllProductsUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response>{

        try{

            const store_id = req.user.store_id

            const allActiveProductsResponse: IGetAllProductsResponse[] = await this.getAllActiveProductsUseCase.execute({store_id});

            return res.status(200).json(allActiveProductsResponse);

        }catch(error){

            console.log(error)

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }
            return res.status(404).json({message: "Erro interno"});
        }
    }
}