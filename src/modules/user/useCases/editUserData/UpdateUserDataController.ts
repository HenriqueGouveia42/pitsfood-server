import type { Request, Response } from "express"
import { AppError } from "../../../../shared/errors/AppError.js"
import { UpdateUserDataUseCase } from "./UpdateUserDataUseCase.js";
export interface IRequestController {
    name?: string;
    password?: string;
    active?: boolean;
}

export class UpdateUserDataController {

    constructor(
        private updateUserDataUseCase: UpdateUserDataUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{
        
        const { target_user_id } = req.params;

        if (!target_user_id) {
            throw new AppError("ID do usuario a ser atualizado precisa vir nos params", 400, "TARGET_USER_ID_NOT_FOUND")
        }

        if(!req.user){
            throw new AppError("req.user undefined");
        }

        const modifier_user_id  = req.user.id;
        const modifier_user_store_id = req.user.store_id;

        if(!modifier_user_id || !modifier_user_store_id){
            throw new AppError("Erro em algum id");
        }

        const { name, password, active }: IRequestController = req.body;

        await this.updateUserDataUseCase.execute({
            target_user_id,
            modifier_user_id,
            modifier_user_store_id,
            name,
            password,
            active,
        });

        return res.status(200).json({message: "Usuario atualizado com sucesso"})
    }
}