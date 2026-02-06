import type { Request, Response } from "express"
import type { GetStoreDataUseCase } from "./GetStoreDataUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IGetStoreDataUseCaseResponse } from "./GetStoreDataUseCase.js"

export class GetStoreDataController{
    constructor(
        private getStoreDataUseCase: GetStoreDataUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{
        
        const store_id: string = req.user.store_id;
        const user_id: string = req.user.id;
            
        const storeData: IGetStoreDataUseCaseResponse  = await this.getStoreDataUseCase.execute({store_id, user_id});

        return res.status(200).json(storeData);

    }
}