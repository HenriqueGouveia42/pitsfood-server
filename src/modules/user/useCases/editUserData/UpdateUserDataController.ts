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
        try{

            const { target_user_id } = req.params;

            if (!target_user_id) {
                throw new AppError("ID do usuario a ser atualizado precisa vir nos params", 400, "TARGET_USER_ID_NOT_FOUND")
            }

            const  owner_id  = req.user.id;
            const owner_store_id = req.user.store_id;

            const { name, password, active }: IRequestController = req.body;

            await this.updateUserDataUseCase.execute({
                target_user_id,
                owner_id,
                owner_store_id,
                name,
                password,
                active,
            });

            return res.status(200).json({message: "Usuario atualizado com sucesso"})

        } catch(error){
            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }
            return res.status(500).json({message: "Erro interno"})
        }
    }
}