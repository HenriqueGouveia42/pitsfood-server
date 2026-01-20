import type { Request, Response } from "express";
import { GetAllActiveProductsUseCase } from "./GetAllActiveProductsUseCase.js";
import { Product } from "../../entities/product.js";
import type { IGetAllActiveProductsResponse } from "./GetAllActiveProductsUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";

export class GetAllActiveProductsController{

    constructor(
        private getAllActiveProductsUseCase: GetAllActiveProductsUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response>{

        try{

            const allActiveProductsResponse: IGetAllActiveProductsResponse[] = await this.getAllActiveProductsUseCase.execute();

            return res.status(200).json(allActiveProductsResponse);

        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }
            return res.status(404).json({message: "Erro interno"});
        }
    }
}