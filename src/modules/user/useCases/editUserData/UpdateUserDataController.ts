import type { Request, Response } from "express"
import { AppError } from "../../../../shared/errors/AppError.js"
import { UpdateUserDataUseCase } from "./UpdateUserDataUseCase.ts.js"

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

            const { id } = req.params; 

            const  id_gestor_trying_to_update_data  = req.user.id;

            if (!id) {
                return res.status(400).json({ error: "ID do usuário não fornecido na URL" });
            }

            const { name, password, active }: IRequestController = req.body;

            await this.updateUserDataUseCase.execute({
                to_update_user_id: id, // Passamos o ID da URL para o UseCase
                name,
                password,
                active,
                id_gestor_trying_to_update_data
            })

            return res.status(200).json({message: "Usuario atualizado com sucesso"})

        } catch(error){
            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }
            return res.status(500).json({message: "Erro interno"})
        }
    }
}