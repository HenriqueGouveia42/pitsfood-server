import { Bill } from "../../entities/bill.js"
import { Product } from "../../../product/entities/product.js"
import type { IBillRepository } from "../../repositories/bill.repository.interface.js";
import type { IProductRepository } from "../../../product/repositories/product.repository.interface.js"
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js"
import { AppError } from "../../../../shared/errors/AppError.js";

interface IItemRequest {
    product_gtin_code: string;
    quantity: number;
}

interface IRequest {
    bill_code_gtin: string;
    user_id: string;
    store_id: string;
    items: IItemRequest[];
}

export class BatchAddItemsUseCase {

    constructor(
        private billRepository: IBillRepository,
        private productRepository: IProductRepository,
        private userRepository: IUserRepository
    ) {}

    async execute({ bill_code_gtin, user_id, store_id, items }: IRequest): Promise<void>{

        if(!items || items.length === 0) throw new AppError("Lista ausente ou sem itens", 400, "LIST_ERROR");

        let currentBill: Bill | null = await this.billRepository.findOpenBillByGtinCode(bill_code_gtin, store_id);

        if (!currentBill){

            //caso 1: nao existe uma comanda com esse numero nessa loja

            const isValidPhysicalBillCard: boolean = await this.billRepository.billWithThisGtinCodeExists(bill_code_gtin, store_id);

            if (!isValidPhysicalBillCard) throw new AppError("Comanda com esse gtin-code nao existe no sistema", 404, "BILL_NOT_FOUND")
            
            //caso 2: existe uma comanda com esse numero nessa loja, mas nao está aberta

            currentBill = Bill.buildOpenedBill(bill_code_gtin, store_id);

            await this.billRepository.createOpenBill(currentBill, store_id);

        }

        const requestedGtins: string[] = items.map(i => i.product_gtin_code);

        const productsFound: Product[] = await this.productRepository.findManySavedProductsByGtinCodes(requestedGtins, store_id);
        
        const requestedGtinsUnique = Array.from(new Set(requestedGtins));

        if (productsFound.length != requestedGtinsUnique.length){
            const foundGtins = productsFound.map(p => p.gtin);
            const missingGtins = requestedGtinsUnique.filter(gtin => !foundGtins.includes(gtin));

            throw new AppError(`Produtos não encontrados ou inativos: ${missingGtins.join(', ')}`, 404, "PRODUCTS_NOT_FOUND")
        }

        for (const gtin of requestedGtinsUnique){

            const product = productsFound.find(p => p.gtin === gtin);

            if (!product) throw new AppError(`Erro de consistência: O produto ${gtin} sumiu da memoria`, 500, "PRODUCT_MISSING")
            
            const totalQuantity = items
                .filter(item => item.product_gtin_code === gtin)
                .reduce((acc, item) => acc + item.quantity, 0);

            currentBill = currentBill.addProduct(
                product,
                totalQuantity,
                user_id
            )
        }

        await this.billRepository.updateSavedBill(currentBill);

    }
}