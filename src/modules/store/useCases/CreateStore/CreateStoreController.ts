import type { Request, Response } from "express";
import type { CreateStoreUseCase } from "./CreateStoreUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class CreateStoreController{
    constructor(
        private createStoreUseCase: CreateStoreUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        try{

            const { name, cnpj } = req.body;

            const owner_id = req.user.id;

            await this.createStoreUseCase.execute({
                name,
                cnpj,
                active: false, //loja criada inicialmente desativada, sem nenhum plano
                owner_id
            })

            return res.status(201).json({message: "Loja criada com sucesso"})

        }catch(error){

            console.log(error);

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.errorCode})
            }

            return res.status(500).json({message: "Erro interno ao criar uma loja"})
        }

    }
}