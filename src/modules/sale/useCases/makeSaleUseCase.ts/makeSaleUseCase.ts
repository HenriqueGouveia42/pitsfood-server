import { Sale } from "../../entities/sale.js"
import type {SaleProductProp, SalePaymentProp } from "../../entities/sale.js"
import { PaymentMethod } from "../../entities/sale.js"
import type { ISaleRepository } from "../../repositories/sale.repository.interface.js"

/*
    type SalePaymentProp = { //representa um pagamento de uma determinada venda  fechada
        readonly sale_payment_id: string,
        readonly amount: Decimal,
        readonly method: PaymentMethod,
        readonly sale_id: string,
    }

*/



import { Bill } from "../../../bill/entities/bill.js"
import type { IBillRepository } from "../../../bill/repositories/bill.repository.interface.js"

import { Product } from "../../../product/entities/product.js"
import type { IProductRepository } from "../../../product/repositories/product.repository.interface.js"

import { Decimal } from "decimal.js"

export interface IProductRequestUseCase{ //interface dos produtos adicionados no balcao que vieram sem comanda
    product_gtin_code: string,
    user_id: string,
    quantity: number
}

interface SalePaymentPropRequestUseCase{
    amount: number,
    method: PaymentMethod,
}


interface IRequestUseCase{
    bill_gtin_codes?: string[],
    products?: IProductRequestUseCase[], //produtos adicionados no balcao que vieram sem comanda
    payments: SalePaymentPropRequestUseCase[],
    user_id: string
}


/*
    {
        "bill_gtin_codes": ["3885", "3317"],
        "products": [
            {
                "product_gtin_code": "2274931369859",
                "user_id": "00ba623d-3ffc-432c-80ec-e5827072cce4",
                "quantity": 2
            },
            {
                "product_gtin_code": "2294408518177",
                "user_id": "00ba623d-3ffc-432c-80ec-e5827072cce4",
                "quantity": 1
            },
        ],
        "payments":[
            {
                "amount": 10,
                "method": "ESPECIE",
            },
            { 
                "amount": 9,
                "method": "PIX"
            }
        ]
    }


*/

export class MakeSaleUseCase{

    constructor(
        private saleRepository: ISaleRepository,
        private billRepository: IBillRepository,
        private productRepository: IProductRepository
    ){}

    async execute({ bill_gtin_codes, products, payments, user_id }: IRequestUseCase){

        //validacoes básicas
        //
        //
        //
        //
        //
        if(payments.length === 0){
            throw new Error("É necessario ao menos um pagamento")
        }
        
        if(bill_gtin_codes?.length === 0 && products?.length === 0){
            throw new Error("É necessario ao menos uma comanda 'bill_gtin_code' ou um 'produto'");
        }
        //
        //
        //
        //
        //
        //validacoes básicas

        const sale_id = crypto.randomUUID();
        let saleProductProps: SaleProductProp[] = [];

        let bills: Bill[] = [];

        //existe ao menos uma comanda para entrar nessa "Sale"
        //
        //
        //
        //     BILL
        //
        //
        //
        let uniqueBillCodes: string[] = [];
        if(bill_gtin_codes && bill_gtin_codes.length != 0){

            uniqueBillCodes = bill_gtin_codes
            ?   Array.from(new Set(bill_gtin_codes))
            :   [];

            bills = await this.billRepository.findManyOpenBillsByGtinCodes(uniqueBillCodes);

            if (bills.length != uniqueBillCodes.length){
                const foundBillCodes = bills.map(bill => bill.bill_code);
                const missingBills = uniqueBillCodes.filter(code => !foundBillCodes.includes(code))
                throw new Error(`As seguintes comandas não foram encontradas ou não estão ABERTAS: ${missingBills.join(', ')}`);
            }

            for (const bill of bills){

                for(const productInBill of bill.items){

                    const saleProductPropToPush: SaleProductProp = {
                        sale_product_id: crypto.randomUUID(),
                        quantity: productInBill.quantity,
                        unit_price_sold: productInBill.price_at_addition,
                        sale_id: sale_id,
                        product_id: productInBill.product_id,
                        origin_bill_id: productInBill.bill_id
                    }

                    saleProductProps.push(
                        saleProductPropToPush
                    )
                }
            }
            
        }
        //
        //
        //
        //     BILL
        //
        //
        //

        let uniqueGtinsCodes: string[] = [];
       
        //existe ao menos um produto avulso - sem comanda - para entrar nessa "Sale"
        if(products && products.length > 0){

            /*"products": [
            {
                "product_gtin_code": "2274931369859",
                "user_id": "00ba623d-3ffc-432c-80ec-e5827072cce4",
                "quantity": 2
            },
            {
                "product_gtin_code": "2294408518177",
                "user_id": "00ba623d-3ffc-432c-80ec-e5827072cce4",
                "quantity": 1
            },
            ],*/
           
            const allGtinsCodes: string[] = products.map(i => i.product_gtin_code);
            uniqueGtinsCodes = Array.from(new Set(allGtinsCodes));

            if(allGtinsCodes.length != uniqueGtinsCodes.length){
                throw new Error("Produtos avulsos - Sem comanda - repetidos")
            }

            const savedProducts: Product[] = await this.productRepository.findManySavedProductsByGtinCodes(uniqueGtinsCodes);

            for (const savedProduct of savedProducts){
                
                const productFound = products.find(p => p.product_gtin_code === savedProduct.gtin);

                //typeScript precisa garantir que ele achou 
                if (!productFound) {
                    throw new Error(`Erro de integridade: Produto solicitado ${savedProduct.gtin} sumiu da lista.`);
                }

                const saleProductPropToPush: SaleProductProp = {
                    sale_product_id: crypto.randomUUID(),
                    quantity: productFound.quantity,
                    unit_price_sold: savedProduct.price,
                    sale_id: sale_id,
                    product_id: savedProduct.id,
                    //origin_bill_id aqui é ausente, ja que o produto nao vem de comanda!
                }

                 saleProductProps.push(
                    saleProductPropToPush
                );
            }

        }

        let salesPaymentProps: SalePaymentProp[] = [];

        /*
            "payments":[
                {
                    "amount": 10,
                    "method": "ESPECIE",
                },
                { 
                    "amount": 9,
                    "method": "PIX"
                }
            ]
        */
            
        const paymentsMethods: string[] = payments.map(p => p.method);
        const uniquePaymentMethods: string[] = Array.from(new Set(paymentsMethods));

        if (paymentsMethods.length != uniquePaymentMethods.length){
            throw new Error("Métodos de pagamentos repetidos")
        }

        for (const payment of payments){

            const salePaymentProps: SalePaymentProp = {
                sale_payment_id: crypto.randomUUID(),
                amount: new Decimal(payment.amount),
                method: payment.method as PaymentMethod,
                sale_id: sale_id
            }

            salesPaymentProps.push(
                salePaymentProps
            )
        }

        const sale: Sale = Sale.buildSale({
            user_id: user_id,
            items: saleProductProps,
            payments: salesPaymentProps,
            sale_id: sale_id
        })

        
        if (sale.total.greaterThan(sale.amountPaid)){
            throw new Error("Valor insuficiente em 'payments'");
        }

        //await this.saleRepository.makeSale(sale);

        //const closedBills: Bill[] = await this.billRepository.closeManyBillsByGtinsCodes(uniqueBillCodes);

        await this.saleRepository.createSaleAndCloseBills(sale, uniqueBillCodes);

        const change: string = (sale.total.minus(sale.amountPaid)).toString();

        return change

    }
}