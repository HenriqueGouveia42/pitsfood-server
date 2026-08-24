import type { Request, Response } from "express";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { UpdateProductIconUseCase } from "./UpdateProductIconUseCase.js";

export class UpdateProductIconController {
    constructor(
        private updateProductIconUseCase: UpdateProductIconUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response> {
        
        const { product_id } = req.params;
        const store_id = req.user?.store_id;
        const user_id = req.user?.id;
        const file = req.file;

        if (!product_id) throw new AppError("ID do produto é obrigatório.", 400, "MISSING_PRODUCT_ID");
        if (!store_id) throw new AppError("Contexto de loja não encontrado.", 403, "STORE_CONTEXT_REQUIRED");
        if (!user_id) throw new AppError("Id de usuário ausente", 403, "USER_CONTEXT_REQUIRED");
        if (!file) throw new AppError("Nenhum arquivo de imagem foi enviado.", 400, "MISSING_FILE");

        const icon_url = await this.updateProductIconUseCase.execute({
            product_id,
            store_id,
            user_id_trying_to_update: user_id,
            icon_file: {
                buffer: file.buffer,
                mimetype: file.mimetype
            }
        });

        return res.status(200).json({ icon_url });
    }
}