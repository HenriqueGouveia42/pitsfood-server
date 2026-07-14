import type { Request, Response } from "express";
import { AppError } from "../../../../shared/errors/AppError.js";
import { UpdateUserPasswordUseCase } from "./UpdateUserPasswordUsecase.js";

export class UpdateUserPasswordController {
    constructor(private updateUserPasswordUseCase: UpdateUserPasswordUseCase) {}

    public async handle(req: Request, res: Response): Promise<Response> {
        const { target_user_id } = req.params;
        if (!target_user_id) throw new AppError("ID do usuario precisa vir nos params", 400);
        if (!req.user || !req.user.id || !req.user.store_id) throw new AppError("Erro na sessao", 401);

        const { password } = req.body;
        if (!password) throw new AppError("Senha é obrigatória", 400);

        await this.updateUserPasswordUseCase.execute({
            target_user_id,
            modifier_user_id: req.user.id,
            modifier_user_store_id: req.user.store_id,
            password,
        });

        return res.status(200).json({ message: "Senha atualizada com sucesso" });
    }
}