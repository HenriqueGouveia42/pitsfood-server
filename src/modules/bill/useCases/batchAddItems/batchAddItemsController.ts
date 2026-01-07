import type { Request, Response } from "express";
import { BatchAddItemsUseCase } from "./batchAddItemsUseCase.js"

export class BatchAddItemsController  {
    
    constructor(private batchAddItemsUseCase: BatchAddItemsUseCase) {}

    public async handle (req: Request, res: Response): Promise<Response> {

        const { bill_code, user_id, items } = req.body;

        if (!bill_code) {
            return res.status(400).json({ error: "O campo 'bill_code' é obrigatório." });
        }
        if (!user_id) {
            return res.status(400).json({ error: "O campo 'user_id' é obrigatório." });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "O campo 'items' deve ser um array contendo produtos." });
        }

        try {

            await this.batchAddItemsUseCase.execute({
                bill_code_gtin: bill_code,
                user_id: user_id,
                items: items
            })

            return res.status(200).json({ message: "Itens adicionados com sucesso" })

        } catch(error: any) {
            console.log(error)
            return res.status(400).json({message: "Erro"})
        }
    }
}