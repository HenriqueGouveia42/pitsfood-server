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
    items: IItemRequest[];
}

export class BatchAddItemsUseCase {

    constructor(
        private billRepository: IBillRepository,
        private productRepository: IProductRepository,
        private userRepository: IUserRepository
    ) {}

    async execute({ bill_code_gtin, user_id, items }: IRequest): Promise<void>{

        const user = await this.userRepository.findSavedUserById(user_id);
        if (!user){
            throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND")
        }

        if(!items || items.length === 0){
            throw new AppError("Lista ausente ou sem itens", 400, "LIST_ERROR" )
        }

        let currentBill: Bill | null = await this.billRepository.findOpenBillByGtinCode(bill_code_gtin);

        if (!currentBill){

            const isValidPhysicalBillCard: boolean = await this.billRepository.billWithThisGtinCodeExists(bill_code_gtin);

            if (!isValidPhysicalBillCard){
                throw new AppError("Comanda com esse gtin-code nao existe no sistema", 404, "BILL_NOT_FOUND")
            }

            currentBill = Bill.buildOpenedBill(bill_code_gtin);

            await this.billRepository.createOpenBill(currentBill)

        }

        const requestedGtins: string[] = items.map(i => i.product_gtin_code);
        const productsFound: Product[] = await this.productRepository.findManySavedProductsByGtinCodes(requestedGtins);
        
        const requestedGtinsUnique = Array.from(new Set(requestedGtins));

        if (productsFound.length != requestedGtinsUnique.length){
            const foundGtins = productsFound.map(p => p.gtin);
            const missingGtins = requestedGtinsUnique.filter(gtin => !foundGtins.includes(gtin));

            throw new AppError(`Produtos não encontrados ou inativos: ${missingGtins.join(', ')}`, 404, "PRODUCTS_NOT_FOUND")
        }

        for (const gtin of requestedGtinsUnique){

            const product = productsFound.find(p => p.gtin === gtin);

            if (!product){
                throw new AppError(`Erro de consistência: O produto ${gtin} sumiu da memoria`, 500, "PRODUCT_MISSING")
            }

            const totalQuantity = items
                .filter(item => item.product_gtin_code === gtin)
                .reduce((acc, item) => acc + item.quantity, 0);

            currentBill = currentBill.addProduct(
                product,
                totalQuantity,
                user.id
            )
        }

        await this.billRepository.updateSavedBill(currentBill);

    }
}