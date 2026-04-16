import type { IProductRepository } from "../../../product/repositories/interfaces/product.repository.interface.js";
import type { ISaleRepository } from "../../repositories/interfaces/sale.repository.interface.js";
import { Decimal } from "decimal.js"
import { PaymentMethod, type SalePaymentProp, type SaleProductProp } from "../../entities/sale.js";
import { Sale } from "../../entities/sale.js";
import type { IBillRepository } from "../../../bill/repositories/interfaces/bill.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import crypto from "crypto"
import type { Bill } from "../../../bill/entities/bill.js";
import type { Product } from "../../../product/entities/product.js";
import { User } from "../../../user/entities/user.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";

type PaymentDTO = {
    amount: number | string | Decimal,
    method: PaymentMethod
}

interface IRequest {
    store_id: string,
    user_id: string,
    bill_physical_codes: string[],
    products_gtin_codes: string[],
    payments: PaymentDTO[]

}

export class MakeSaleUseCase{
    constructor(
        private saleRepository: ISaleRepository,
        private productRepository: IProductRepository,
        private billRepository: IBillRepository,
        private userRepository: IUserRepository
    ) {}

    public async execute( {
            store_id,
            user_id,
            bill_physical_codes = [], //valor padrao - array vazio - caso venha undefined do controller
            products_gtin_codes = [],
            payments = []
        }: IRequest ): Promise<Sale> {

        const user_closing_sale: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!user_closing_sale) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        
        if (bill_physical_codes.length === 0 && products_gtin_codes.length === 0) throw new AppError("A venda precisa ter pelo menos uma comanda ou um produto avulso.", 400, "EMPTY_SALE");

        if (payments.length === 0) throw new AppError("É necessário informar pelo menos uma forma de pagamento.", 400, "NO_PAYMENT_METHOD");

        //preciso ggerar o ID da venda AGORA, para poder espalhá-lo nas chaves estrangeiras

        const sale_id: string = crypto.randomUUID();
        const saleProducts: SaleProductProp[] = [];

        // * * * PROCESSAR COMANDAS * * *
        for (const code of bill_physical_codes) {

            const openBills: Bill[] | undefined = await this.billRepository.getOpenBillByGtinCode(code, store_id);

            if (!openBills || openBills.length === 0 || (openBills === undefined)) throw new AppError(`A comanda ${code} não foi encontrada ou já está fechada`, 404, "BILL_NOT_FOUND_OR_CLOSED");

            if (openBills.length > 1) throw new AppError(`Erro Crítico: Múltiplas comandas abertas com o código ${code}.`, 500, "DATA_INTEGRITY_ERROR");

            const bill: Bill | undefined = openBills[0];

            if (bill === undefined) throw new AppError("Erro de integridade grave", 500, "INTEGRITY_ERROR");

            //Precisamos agrupar os itens da comanda

            //chave "product_id" + "price" para nao misturar caso o preco mude
            const billItemsMap = new Map<string, SaleProductProp>();

            for (const item of bill.items) {

                const groupKey: string = `${item.product_id}-${item.price_at_addition.toNumber()}`;

                if (billItemsMap.has(groupKey)){ //incrementa a quantidade
                    
                    const existing = billItemsMap.get(groupKey)!;
                    billItemsMap.set(groupKey, { ...existing, quantity: existing.quantity + 1 });
                } else { //cria nova linha para venda

                    billItemsMap.set(groupKey, {
                        sale_product_id: crypto.randomUUID(),
                        quantity: 1,
                        unit_price_snapshot: item.price_at_addition,
                        product_name_snapshot: item.product_name,
                        product_gtin_snapshot: item.product_gtin_code,
                        store_id,
                        sale_id,
                        product_id: item.product_id,
                        origin_bill_id: bill.bill_id
                    })
                }
            }

            saleProducts.push(...Array.from(billItemsMap.values()));


        }

        // * * * PROCESSAR PRODUTOS AVULSOS * * *

        if (products_gtin_codes.length > 0) {

            const gtinCounts = products_gtin_codes.reduce((acc, gtin) => {
                acc[gtin] = (acc[gtin] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const uniqueGtins = Object.keys(gtinCounts);

            const dbProducts: Product[] = await this.productRepository.findManySavedProductsByGtinCodes(uniqueGtins, store_id);

            if (dbProducts.length !== uniqueGtins.length) {
                
                //extrai apenas os GTINs que o banco encontrou
                const foundGtins = dbProducts.map(p => p.gtin);
                
                //filtra quais dos solicitados NÃO estão na lista de encontrados
                const missingGtins = uniqueGtins.filter(gtin => !foundGtins.includes(gtin));

                throw new AppError(
                    `Os seguintes produtos não foram encontrados: ${missingGtins.join(', ')}`, 
                    404, 
                    "PRODUCT_NOT_FOUND"
                );
            }

            for (const gtin of uniqueGtins) {

                const product: Product | undefined = dbProducts.find(p => p.gtin === gtin);

                if (!product) throw new AppError(`Produto avulso com código ${gtin} não encontrado no sistema.`, 404, "PRODUCT_NOT_FOUND");

                if (!product.active) throw new AppError(`O produto ${product.name} está desativado e não pode ser vendido.`, 400, "INACTIVE_PRODUCT");

                saleProducts.push({
                    sale_product_id: crypto.randomUUID(),
                    quantity: gtinCounts[gtin] ?? 1,
                    unit_price_snapshot: new Decimal(product.price), // Preço ATUAL do produto
                    product_name_snapshot: product.name,
                    product_gtin_snapshot: product.gtin,
                    store_id,
                    sale_id,
                    product_id: product.id,
                });
            }
        }

        // * * * PROCESSA OS PAGAMENTOS * * *
        const salePayments: SalePaymentProp[] = payments.map(p => ({
            sale_payment_id: crypto.randomUUID(),
            amount: new Decimal(p.amount),
            method: p.method,
            sale_id: sale_id
        }));

        const sale: Sale = Sale.buildSale({
            sale_id,
            store_id,
            user_id,
            items: saleProducts,
            payments: salePayments,
            seller_name: user_closing_sale.username,
            seller_role: user_closing_sale.role
        });

        await this.saleRepository.createSaleAndCloseBills(sale, bill_physical_codes);

        return sale;
    }
}