import type { Request, Response } from "express"
import type { UpdateStoreDataUseCase } from "./UpdateStoreDataUseCase.js";

interface ControllerDTO {
    new_name: string
}

export class UpdateStoreDataController{
    constructor(
        private updateStoreDataUseCase: UpdateStoreDataUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const { new_name }: ControllerDTO = req.body;
        const store_id: string = req.user.store_id;

        await this.updateStoreDataUseCase.execute({ store_id, new_name });

        return res.status(200).json({message: "Atualizado com sucesso"});

    }
}