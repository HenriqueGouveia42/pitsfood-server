import type { Request, Response } from "express"
import { ListMyStoresUseCase } from "./ListMyStoresUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js"

import type { UseCaseResponseDTO } from "./ListMyStoresUseCase.js";

export class ListMyStoresController{
    constructor(
        private listMyStoreUseCase:  ListMyStoresUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{
        try{

            const user_id = req.user.id;
            const is_paying_user = req.user.is_paying_user;

            const stores_data: UseCaseResponseDTO = await this.listMyStoreUseCase.execute({user_id, is_paying_user});

            return res.status(200).json(stores_data)

        }catch(error){
            if (error instanceof AppError){
                return res.status(error.statusCode).json({message: error.message})
            }
            return res.status(500).json({message: "Erro interno ao listar as lojas do usuario"})
        }
    }
}