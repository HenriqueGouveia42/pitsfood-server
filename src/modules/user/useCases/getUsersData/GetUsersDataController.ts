import type { Request, Response } from "express"
import { GetUsersDataUseCase } from "./GetUsersDataUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js"
import type { GetUsersDataUseCaseResponse } from "./GetUsersDataUseCase.js"

export class GetUsersDataController{

    constructor(
        private getUsersDataUseCase: GetUsersDataUseCase
    ){}

    public async handle(req: Request, res: Response){
        
        const { active } = req.query;
        const store_id = req.user.store_id;

        //lógica de conversão: string -> boolean | Undefined
        let activeFilter: boolean | undefined = undefined;

        if (active === 'true') {
             activeFilter = true;
        } else if (active === 'false') {
            activeFilter = false;
        }
           
        const users = await this.getUsersDataUseCase.execute(store_id, activeFilter);

        return res.status(200).json(users);
    }

}