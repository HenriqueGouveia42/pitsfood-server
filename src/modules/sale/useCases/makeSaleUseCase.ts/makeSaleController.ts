import type { Request, Response } from "express";
import { MakeSaleUseCase } from "./makeSaleUseCase.js";
import { type PaymentMethod } from "../../entities/sale.js"
import { type IProductRequestUseCase } from "./makeSaleUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js";

interface ISalePaymentPropRequestController{
    amount: number,
    method: PaymentMethod ,
}

interface IProductRequestController{ 
    product_gtin_code: string,
    quantity: number
}

interface ImakeSaleRequestController{
    bill_gtin_codes?: string[], 
    payments: ISalePaymentPropRequestController[]
    products?: IProductRequestController[],
}

export class MakeSaleController{
    
    constructor(private makeSaleUseCase: MakeSaleUseCase){}

    public async handle(req: Request, res: Response): Promise<Response>{

        try{

            const user_id = req.user.id;

            if (!user_id) {
                return res.status(400).json({ error: "'user_id' ausente no middleware" });
            }

            const { bill_gtin_codes, payments, products }: ImakeSaleRequestController = req.body;

            // 1. Validação Obrigatória: Pagamentos
            if(!payments || payments.length === 0){
                throw new AppError("Campo 'payments' ausente ou sem itens", 400, "PAYMENT_MISSING")
            }

            // 2. Lógica Flexível: Verifica o que temos disponível
            const hasBills = bill_gtin_codes && bill_gtin_codes.length > 0;
            const hasProducts = products && products.length > 0;

            // 3. Validação: Precisa ter pelo menos um dos dois (Comanda OU Produto)
            if (!hasBills && !hasProducts) {
                throw new AppError("É necessário informar ao menos uma comanda ('bill_gtin_codes') ou um produto ('products')", 400, "INVALID_REQUEST_DATA")
            }

            // 4. Mapeamento Condicional
            // Se tiver produtos, mapeia. Se não tiver, passa array vazio.
            const productRequestsToPassToUseCase: IProductRequestUseCase[] = hasProducts
                ? products!.map(p => ({
                    product_gtin_code: p.product_gtin_code,
                    user_id: user_id,
                    quantity: p.quantity
                }))
                : []; 

            await this.makeSaleUseCase.execute({
                bill_gtin_codes: bill_gtin_codes || [], // Garante array vazio se undefined
                products: productRequestsToPassToUseCase,
                payments: payments,
                user_id: user_id
            })

            return res.status(200).json({message: "Venda feita com sucesso!"})

        }catch(error){

            if (error instanceof AppError){
                return res.status(error.statusCode).json({message:error.message, code:error.errorCode})
            }

            return res.status(500).json({message: "Erro interno"})
        }

    }
}