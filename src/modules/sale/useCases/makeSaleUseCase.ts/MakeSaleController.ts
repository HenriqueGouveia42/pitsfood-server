import type { Request, Response } from "express";
import type { MakeSaleUseCase } from "./MakeSaleUseCase.js";
import { PaymentMethod } from "../../entities/sale.js";
import { AppError } from "../../../../shared/errors/AppError.js";

type PaymentDTO = {
    amount: string | number;
    method: PaymentMethod;
};

interface MakeSaleRequestDTO {
    bill_physical_codes?: string[];
    products_gtin_codes?: string[];
    payments: PaymentDTO[];
}

export class MakeSaleController {

    constructor(
        private makeSaleUseCase: MakeSaleUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response> {

        const { bill_physical_codes, products_gtin_codes, payments }: MakeSaleRequestDTO = req.body;

        if (typeof(req.user) === 'undefined'){
            throw new AppError("req.user undefined", 500, "REQ_USER_UNDEFINED");
        }

        const user_id: string = req.user.id;
        const store_id: string = req.user.store_id;

        const sale = await this.makeSaleUseCase.execute({ 
            store_id, 
            user_id, 
            bill_physical_codes: bill_physical_codes ?? [], 
            products_gtin_codes: products_gtin_codes ?? [], 
            payments 
        });
        
        
        const totalVenda = sale.total.toNumber();
        const totalPago = sale.amountPaid.toNumber();
        
        const troco = Number((totalPago - totalVenda).toFixed(2));

        const saleResponse = {
            sale_id: sale.id,
            status: sale.status,
            total_amount: totalVenda,
            amount_paid: totalPago,
            change_due: troco > 0 ? troco : 0, //Se pagou a mais, manda o troco. Se pagou exato, manda 0.
            created_at: sale.createdAt
        };

        return res.status(201).json({
            message: "Venda concluída com sucesso.",
            sale: saleResponse
        });
    }
}