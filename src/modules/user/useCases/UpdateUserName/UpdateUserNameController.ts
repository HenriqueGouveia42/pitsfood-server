import type { Request, Response } from "express";
import { AppError } from "../../../../shared/errors/AppError.js";
import { UpdateUserNameUseCase } from "./UpdateUserNameUseCase.js";

export class UpdateUserNameController {
    constructor(private updateUserNameUseCase: UpdateUserNameUseCase) {}

    public async handle(req: Request, res: Response): Promise<Response> {

        console.log("Estou no controller de atualizar o nome do usuario!");
        
        const { target_user_id } = req.params;
        if (!target_user_id) throw new AppError("ID do usuario a ser atualizado precisa vir nos params", 400, "TARGET_USER_ID_NOT_FOUND");
        if (!req.user || !req.user.id || !req.user.store_id) throw new AppError("Erro em algum id da sessao", 401);

        const { name } = req.body;
        if (!name) throw new AppError("Nome é obrigatório", 400);

        await this.updateUserNameUseCase.execute({
            target_user_id,
            modifier_user_id: req.user.id,
            modifier_user_store_id: req.user.store_id,
            name,
        });

        return res.status(200).json({ message: "Nome do usuário atualizado com sucesso" });
    }
}