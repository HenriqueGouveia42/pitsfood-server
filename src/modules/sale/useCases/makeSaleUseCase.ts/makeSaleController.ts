import type { Request, Response } from "express";
import { MakeSaleUseCase } from "./makeSaleUseCase.js";
import { type PaymentMethod } from "../../entities/sale.js"
import { type IProductRequestUseCase } from "./makeSaleUseCase.js"

/*
    export interface IProductRequestUseCase{ //interface dos produtos adicionados no balcao que vieram sem comanda
        product_gtin_code: string,
        user_id: string,
        quantity: number
    }
*/



interface ISalePaymentPropRequestController{
    amount: number,
    method: PaymentMethod ,
}

/**
    interface SalePaymentPropRequestUseCase{
    amount: number,
    method: PaymentMethod,
}
 
*/

interface IProductRequestController{ //produtos avulsos que vieram do caixa
    product_gtin_code: string,
    quantity: number
}

interface ImakeSaleRequestController{
    bill_gtin_codes?: string[], //gtins codes das comandas que vao entrar nessa venda
    payments: ISalePaymentPropRequestController[]
    products?: IProductRequestController[],
}

export class MakeSaleController{
    
    constructor(private makeSaleUseCase: MakeSaleUseCase){}

    public async handle(req: Request, res: Response): Promise<Response>{

        try{

            //vem anexado pelo middleware
            const user_id = req.user.id;

            if (!user_id) {
                return res.status(400).json({ error: "'user_id' ausente no middleware" });
            }

            const { bill_gtin_codes, payments, products }: ImakeSaleRequestController = req.body;

            if(!bill_gtin_codes || bill_gtin_codes.length === 0){
                throw new Error("Campo 'bill_gtin_codes' ausente ou sem itens")
            }

            if(!payments || payments.length === 0){
                throw new Error("Campo 'payments' ausente ou sem itens")
            }


            if (!products || products.length === 0){
                throw new Error("Campo 'products' ausente ou sem itens")
            }

            const productRequestsToPassToUseCase: IProductRequestUseCase[] = products?.map(p => ({
                product_gtin_code: p.product_gtin_code,
                user_id: user_id,
                quantity: p.quantity
            }))

            await this.makeSaleUseCase.execute({
                bill_gtin_codes: bill_gtin_codes,
                products: productRequestsToPassToUseCase,
                payments: payments,
                user_id: user_id
            })

            return res.status(200).json({messge: "Venda feita com sucesso!"})

        }catch(error){
            console.log(error);
            return res.status(400).json({message: "Erro"})
        }

    }
}