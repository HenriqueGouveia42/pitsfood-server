import type { Request, Response } from "express";
import { AppError } from "../../../../shared/errors/AppError.js";
import { UpdateStoreIconUseCase } from "./UpdateStoreIconUseCase.js";

export class UpdateStoreIconController {
    constructor(
        private updateStoreIconUseCase: UpdateStoreIconUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response> {
        
        const store_id = req.user.store_id;
        const file = req.file;
        const user_id = req.user?.id;

        if (!store_id) throw new AppError("Contexto de loja não encontrado.", 403, "STORE_CONTEXT_REQUIRED");
        if (!file) throw new AppError("Nenhum arquivo de imagem foi enviado.", 400, "MISSING_FILE");
        if(!user_id) throw new AppError("Id de usuario ausente")

        const icon_url = await this.updateStoreIconUseCase.execute({
            store_id,
            user_id,
            icon_file: {
                buffer: file.buffer,
                mimetype: file.mimetype
            }
        });

        return res.status(200).json({ icon_url });
    }
}