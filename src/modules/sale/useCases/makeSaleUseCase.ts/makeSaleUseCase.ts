import { Sale } from "../../entities/sale.js"
import type { SaleProductProp, SalePaymentProp } from "../../entities/sale.js"
import { PaymentMethod } from "../../entities/sale.js"
import type { ISaleRepository } from "../../repositories/sale.repository.interface.js"

import { Bill } from "../../../bill/entities/bill.js"
import type { IBillRepository } from "../../../bill/repositories/bill.repository.interface.js"

import { Product } from "../../../product/entities/product.js"
import type { IProductRepository } from "../../../product/repositories/product.repository.interface.js"

import { Decimal } from "decimal.js"
import { AppError } from "../../../../shared/errors/AppError.js"

export interface IProductRequestUseCase{ 
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
    products?: IProductRequestUseCase[], 
    payments: SalePaymentPropRequestUseCase[],
    user_id: string
}

export class MakeSaleUseCase{

    constructor(
        private saleRepository: ISaleRepository,
        private billRepository: IBillRepository,
        private productRepository: IProductRepository
    ){}

    async execute({ bill_gtin_codes, products, payments, user_id }: IRequestUseCase){

        if(!payments || payments.length === 0){
            throw new AppError("É necessario ao menos um pagamento", 400, "PAYMENT_QUANTITY_ERROR")
        }

        const hasBills = bill_gtin_codes && bill_gtin_codes.length > 0
        const hasProducts = products && products.length > 0;

        if (!hasBills && !hasProducts){
            throw new AppError("É necessário ao menos um produto avulso ou uma comanda", 400, "MAKE_SALE_ERROR");
        }

        if(payments.length === 0){
            throw new AppError("É necessario ao menos um pagamento", 400, "PAYMENT_QUANTITY_ERROR")
        }
        
        const sale_id = crypto.randomUUID();
        let saleProductProps: SaleProductProp[] = [];

        let bills: Bill[] = [];
        let uniqueBillCodes: string[] = [];

        if(bill_gtin_codes && bill_gtin_codes.length != 0){

            uniqueBillCodes = bill_gtin_codes
            ?   Array.from(new Set(bill_gtin_codes))
            :   [];

            bills = await this.billRepository.findManyOpenBillsByGtinCodes(uniqueBillCodes);

            if (bills.length != uniqueBillCodes.length){
                const foundBillCodes = bills.map(bill => bill.bill_code);
                const missingBills = uniqueBillCodes.filter(code => !foundBillCodes.includes(code))

                throw new AppError(`As seguintes comandas não foram encontradas ou não estão ABERTAS: ${missingBills.join(', ')}`, 400, "BILLS_ERROR")
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
                    saleProductProps.push(saleProductPropToPush)
                }
            }
        }

        let uniqueGtinsCodes: string[] = [];
       
        if(products && products.length > 0){
            
            const allGtinsCodes: string[] = products.map(i => i.product_gtin_code);
            uniqueGtinsCodes = Array.from(new Set(allGtinsCodes));

            if(allGtinsCodes.length != uniqueGtinsCodes.length){
                throw new AppError("Produtos avulsos - Sem comanda - repetidos", 400, "WRONG_JSON_PRODUCTS")
            }

            const savedProducts: Product[] = await this.productRepository.findManySavedProductsByGtinCodes(uniqueGtinsCodes);

            for (const savedProduct of savedProducts){
                
                const productFound = products.find(p => p.product_gtin_code === savedProduct.gtin);

                if (!productFound) {
                    throw new AppError(`Erro de integridade: Produto solicitado ${savedProduct.gtin} sumiu da lista.`, 500, "PRODUCT_INTERNAL_ERROR")
                }

                // --- ALTERAÇÃO 1: TRAVA DE SEGURANÇA (QUANTIDADE) ---
                if (productFound.quantity > 500) {
                     throw new AppError(`Quantidade suspeita (${productFound.quantity}) para o produto ${savedProduct.name}. Verifique a digitação.`, 400, "SECURITY_LIMIT_EXCEEDED");
                }
                // ----------------------------------------------------

                const saleProductPropToPush: SaleProductProp = {
                    sale_product_id: crypto.randomUUID(),
                    quantity: productFound.quantity,
                    unit_price_sold: savedProduct.price,
                    sale_id: sale_id,
                    product_id: savedProduct.id,
                }

                 saleProductProps.push(saleProductPropToPush);
            }
        }

        //
        //calcula o total real da venda (Itens * Preço)
        const totalSaleValue = saleProductProps.reduce((acc, item) => {
             return acc.plus(item.unit_price_sold.times(item.quantity));
        }, new Decimal(0));

        //trava de segurança para valor total (evita o numeros muito altos - suspeita de erro de digitacao)
        if (totalSaleValue.greaterThan(50000)) {
             throw new AppError(`Valor total da venda (R$ ${totalSaleValue}) excede o limite de segurança.`, 400, "SECURITY_LIMIT_EXCEEDED");
        }
        // ---------------------------------------------------

        let salesPaymentProps: SalePaymentProp[] = [];
        
        const paymentsMethods: string[] = payments.map(p => p.method);
        const uniquePaymentMethods: string[] = Array.from(new Set(paymentsMethods));

        if (paymentsMethods.length != uniquePaymentMethods.length){
            throw new AppError("Métodos de pagamentos repetidos", 400, "REPEATED_PAYMENTS")
        }

        let totalPaidRaw = new Decimal(0);

        for (const payment of payments){
            const amountDecimal = new Decimal(payment.amount);
            totalPaidRaw = totalPaidRaw.plus(amountDecimal);

            const salePaymentProps: SalePaymentProp = {
                sale_payment_id: crypto.randomUUID(),
                amount: amountDecimal,
                method: payment.method as PaymentMethod,
                sale_id: sale_id
            }

            salesPaymentProps.push(salePaymentProps)
        }

        
        //se pagou MENOS (com margem de erro 0.01)
        if (totalPaidRaw.lessThan(totalSaleValue.minus(0.01))) {
            throw new AppError(`Valor insuficiente em 'payments'. Total: ${totalSaleValue}, Pago: ${totalPaidRaw}`, 422, "INSUFICIENT_PAYMENT");
        }

        let changeValue = new Decimal(0);
        
        //se pagou MAIS (Cenário de troco) - essa validacao ja é feita no front-end, mas nao podemos confiar em nada que vem daquele reino...
        if (totalPaidRaw.greaterThan(totalSaleValue)) {
            changeValue = totalPaidRaw.minus(totalSaleValue);

            //encontra o pagamento em dinheiro para descontar o troco
            const cashPaymentIndex = salesPaymentProps.findIndex(p => p.method === PaymentMethod.ESPECIE);
            
            if (cashPaymentIndex === -1) {
                //se o cliente pagou a mais no cartão/pix, isso é um erro operacional (ou gorjeta não tratada)
                throw new AppError(`Pagamento excedente de R$ ${changeValue} sem dinheiro em espécie para registrar troco.`, 400, "INVALID_PAYMENT_EXCESS");
            }

            const oldPayment = salesPaymentProps[cashPaymentIndex]!;

            const correctedPayment: SalePaymentProp = {
                sale_payment_id: oldPayment.sale_payment_id,
                method: oldPayment.method,
                sale_id: oldPayment.sale_id,
                amount: oldPayment.amount.minus(changeValue) // Novo valor calculado
            };

            salesPaymentProps[cashPaymentIndex] = correctedPayment;

        }
        // -----------------------------------------------------------

        const sale: Sale = Sale.buildSale({
            user_id: user_id,
            items: saleProductProps,
            payments: salesPaymentProps,
            sale_id: sale_id
        })

        
        if (sale.total.greaterThan(sale.amountPaid.plus(0.02))){
             //margem de 0.02 apenas para evitar erro de dízima, mas na pratica deve ser igual
             throw new AppError("Erro interno: Inconsistência matemática ao fechar venda.", 500, "INTERNAL_MATH_ERROR" )
        }

        await this.saleRepository.createSaleAndCloseBills(sale, uniqueBillCodes);

        //retorna o troco positivo
        return changeValue.toString();
    }
}