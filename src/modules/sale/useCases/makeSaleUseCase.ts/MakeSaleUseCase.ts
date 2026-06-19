import type { IProductRepository } from "../../../product/repositories/interfaces/product.repository.interface.js";
import { Decimal } from "decimal.js"
import { PaymentMethod, type SalePaymentProp, type SaleProductProp } from "../../entities/sale.js";
import { Sale } from "../../entities/sale.js";
import type { IBillRepository } from "../../../bill/repositories/interfaces/bill.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import crypto from "crypto"
import type { Bill } from "../../../bill/entities/bill.js";
import type { Product } from "../../../product/entities/product.js";
import { User } from "../../../user/entities/user.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";

// Importamos o novo Service
import type { CloseSaleService } from "../../services/CloseSaleService.js";

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

export class MakeSaleUseCase {
    constructor(
        private closeSaleService: CloseSaleService, 
        
        private productRepository: IProductRepository,
        private billRepository: IBillRepository,
        private userRepository: IUserRepository
    ) {}

    public async execute({
            store_id,
            user_id,
            bill_physical_codes = [], 
            products_gtin_codes = [],
            payments = []
        }: IRequest): Promise<Sale> {

        const user_closing_sale: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!user_closing_sale) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        
        if (bill_physical_codes.length === 0 && products_gtin_codes.length === 0) 
            throw new AppError("A venda precisa ter pelo menos uma comanda ou um produto avulso.", 400, "EMPTY_SALE");

        if (payments.length === 0) 
            throw new AppError("É necessário informar pelo menos uma forma de pagamento.", 400, "NO_PAYMENT_METHOD");

        const sale_id: string = crypto.randomUUID();
        const saleProducts: SaleProductProp[] = [];

        const uniqueBillCodes = Array.from(new Set(bill_physical_codes));

        // * * * PROCESSAR COMANDAS * * *
        if(uniqueBillCodes.length > 0){

            const openBills: Bill[] = await this.billRepository.getManyOpenBillsByCodes(uniqueBillCodes, store_id);

            if(openBills.length !== uniqueBillCodes.length) {
                const foundCodes = openBills.map(b => b.bill_code);
                const missingCodes = uniqueBillCodes.filter(code => !foundCodes.includes(code));
                throw new AppError(`As seguintes comandas não foram encontradas ou já estão fechadas: ${missingCodes.join(', ')}`, 404, "BILL_NOT_FOUND_OR_CLOSED");
            }

            for (const bill of openBills) {

                const billItemsMap = new Map<string, SaleProductProp>();

                for (const item of bill.items) {

                    const groupKey: string = `${item.product_id}-${item.price_at_addition.toNumber()}`;

                    if(billItemsMap.has(groupKey)){
                        const existing = billItemsMap.get(groupKey)!;
                        billItemsMap.set(groupKey, { ...existing, quantity: existing.quantity + 1 });

                    } else {
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
                const foundGtins = dbProducts.map(p => p.gtin);
                const missingGtins = uniqueGtins.filter(gtin => !foundGtins.includes(gtin));
                throw new AppError(`Os seguintes produtos não foram encontrados: ${missingGtins.join(', ')}`, 404, "PRODUCT_NOT_FOUND");
            }

            for (const gtin of uniqueGtins) {
                const product: Product | undefined = dbProducts.find(p => p.gtin === gtin);
                if (!product) throw new AppError(`Produto avulso com código ${gtin} não encontrado no sistema.`, 404, "PRODUCT_NOT_FOUND");
                if (!product.active) throw new AppError(`O produto ${product.name} está desativado e não pode ser vendido.`, 400, "INACTIVE_PRODUCT");

                saleProducts.push({
                    sale_product_id: crypto.randomUUID(),
                    quantity: gtinCounts[gtin] ?? 1,
                    unit_price_snapshot: new Decimal(product.price),
                    product_name_snapshot: product.name,
                    product_gtin_snapshot: product.gtin,
                    store_id,
                    sale_id,
                    product_id: product.id,
                    origin_bill_id: null
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

        const now_string: string = new Date().toISOString();

        const sale: Sale = Sale.buildSale({
            sale_id,
            store_id,
            user_id,
            items: saleProducts,
            payments: salePayments,
            seller_name: user_closing_sale.username,
            seller_role: user_closing_sale.role,
            now_string: now_string
        });

        // DELEGAÇÃO PARA A TRANSAÇÃO ATÔMICA
        await this.closeSaleService.execute({
            sale: sale,
            billCodesToClose: uniqueBillCodes
        });

        return sale;
    }
}