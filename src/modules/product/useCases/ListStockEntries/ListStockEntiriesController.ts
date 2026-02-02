import type { Request, Response } from "express"
import type { ListStockEntriesUseCase } from "./ListStockEntriesUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { UserRole } from "../../../user/entities/user.js"; // Importe se precisar validar a role aqui, ou deixe pro usecase

// Dica: Geralmente não precisamos definir interface DTO dentro do Controller para uma variável simples.
// O Controller só prepara os dados.

export class ListStockEntriesController{
    constructor(
        private listStockEntriesUseCase: ListStockEntriesUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{
        try{

            const user_role = req.user.role;
            const store_id = req.user.store_id;

            const pageQuery = req.query.page as string | undefined;

            const product_id = req.query.product_id as string | undefined;
            
            const page: number = pageQuery ? parseInt(pageQuery) : 1;

            if (isNaN(page) || page < 1) {
                throw new AppError("Número de página inválido", 400, "INVALID_PAGE");
            }

            const items_per_page: number = 15;

            const result = await this.listStockEntriesUseCase.execute({
                store_id,
                user_role,
                page,
                items_per_page,
                product_id
            });

            return res.status(200).json(result);

        }catch(error){
            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message})
            }
            return res.status(500).json({message: "Erro interno ao retornar as ultimas entradas de estoque"});
        }
    }
}