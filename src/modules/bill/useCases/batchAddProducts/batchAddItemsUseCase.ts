import { Bill } from "../../entities/bill.js"
import { Product } from "../../../product/entities/product.js"
import type { IBillRepository } from "../../repositories/bill.repository.interface.js";
import type { IProductRepository } from "../../../product/repositories/product.repository.interface.js"
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js"
import { AppError } from "../../../../shared/errors/AppError.js";

type product_gtin_quantity = {
    product_gtin: string,
    quantity: number
}

type RequestDTO =  {
    bill_code_gtin: string;
    user_id: string;
    store_id: string;
    products_gtins_quantities: product_gtin_quantity[]
}

export class BatchAddItemsUseCase {

    constructor(
        private billRepository: IBillRepository,
        private productRepository: IProductRepository,
    ) {}

    async execute({ bill_code_gtin, user_id, store_id, products_gtins_quantities }: RequestDTO): Promise<void>{

        if(!products_gtins_quantities || products_gtins_quantities.length === 0) throw new AppError("Lista de pares gtin-quantidade vazia ou nula", 400, "EMPTY_LIST ");

        const physicalBillCardExists: boolean = await this.billRepository.physicalBillWithThisGtinCodeExists(bill_code_gtin, store_id);
        if (!physicalBillCardExists) throw new AppError(`Não existe uma comanda de numero ${bill_code_gtin} no sistema`);


        const billArray: Bill[]  =  await this.billRepository.getOpenBillByGtinCode(bill_code_gtin, store_id);

        let bill: Bill;

        if (billArray.length == 0){

            bill = Bill.buildOpenedBill(bill_code_gtin, store_id);

        } else {

            if (billArray.length != 1) throw new AppError("Erro Crítico: Múltiplas comandas abertas com o mesmo código.", 500, "DATA_INTEGRITY_ERROR");
            if (typeof(billArray[0]) == 'undefined') throw new AppError("Item sumiu da memoria", 500, "STRANGE_BEHAVIOR"); //seguro morreu de velho

            bill = billArray[0];
        }

        for (const item of products_gtins_quantities){

            const product: Product | null = await this.productRepository.findSavedProductByGtinCode(item.product_gtin, store_id);
            if (!product) throw new AppError(`O produto com GTIN ${item.product_gtin} nao encontrado`);

            bill = bill.addProduct(product, item.quantity, store_id, user_id);
        }

        await this.billRepository.upsertBill(bill);

    }
}