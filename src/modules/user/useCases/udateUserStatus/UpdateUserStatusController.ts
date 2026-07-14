import type { Request, Response } from "express";
import { AppError } from "../../../../shared/errors/AppError.js";
import { UpdateUserStatusUseCase } from "./UpdateUserStatusUseCase.js";

export class UpdateUserStatusController {
    constructor(private updateUserStatusUseCase: UpdateUserStatusUseCase) {}

    public async handle(req: Request, res: Response): Promise<Response> {
        const { target_user_id } = req.params;
        if (!target_user_id) throw new AppError("ID do usuario precisa vir nos params", 400);
        if (!req.user || !req.user.id || !req.user.store_id) throw new AppError("Erro na sessao", 401);

        const { active } = req.body;
        if (typeof active !== "boolean") throw new AppError("Status de ativação é obrigatório", 400);

        await this.updateUserStatusUseCase.execute({
            target_user_id,
            modifier_user_id: req.user.id,
            modifier_user_store_id: req.user.store_id,
            active,
        });

        return res.status(200).json({ message: "Status atualizado com sucesso" });
    }
}