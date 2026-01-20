import type { Request, Response } from "express"
import { GetUsersDataUseCase } from "./GetUsersDataUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js"
import type { GetUsersDataUseCaseResponse } from "./GetUsersDataUseCase.js"

export class GetUsersDataController{

    constructor(
        private getUsersDataUseCase: GetUsersDataUseCase
    ){}

    public async handle(req: Request, res: Response){
        try{

            const { active } = req.query;

            //lógica de conversão: string -> boolean | Undefined
            let activeFilter: boolean | undefined = undefined;

            if (active === 'true') {
                activeFilter = true;
            } else if (active === 'false') {
                activeFilter = false;
            }
           
            const users = await this.getUsersDataUseCase.execute(activeFilter);

            return res.status(200).json(users);
        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }

            return res.status(500).json({message: "Erro interno"})
        }
    }

}