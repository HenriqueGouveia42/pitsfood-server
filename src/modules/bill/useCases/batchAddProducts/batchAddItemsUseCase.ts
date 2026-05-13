import { Bill, type BuildBillProps } from "../../entities/bill.js"
import { Product } from "../../../product/entities/product.js"
import type { IBillRepository } from "../../repositories/interfaces/bill.repository.interface.js"
import type { IProductRepository } from "../../../product/repositories/interfaces/product.repository.interface.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import { DomainError } from "../../../../shared/errors/DomainError.js";

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

        const now_string: string = new Date().toISOString();


        if (billArray.length == 0){

            const bill_id: string = crypto.randomUUID();
            const build_props: BuildBillProps = {
                bill_id,
                bill_code_gtin,
                store_id,
                now_string
            }

            bill = Bill.buildOpenedBill(build_props);

        } else {

            if (billArray.length != 1) throw new AppError("Erro Crítico: Múltiplas comandas abertas com o mesmo código.", 500, "DATA_INTEGRITY_ERROR");
            if (typeof(billArray[0]) == 'undefined') throw new AppError("Item sumiu da memoria", 500, "STRANGE_BEHAVIOR"); //seguro morreu de velho

            bill = billArray[0];
        }

        const gtinsToFetch: string[] = products_gtins_quantities.map(item => item.product_gtin);
        const productsArray: Product[] = await this.productRepository.findManySavedProductsByGtinCodes(gtinsToFetch, store_id);
        if (gtinsToFetch.length != productsArray.length) throw new AppError("Algum produto sumiu", 500, "STRANGE_BEHAVIOR")

        // Criar um Dicionário (Map) em memória para busca rápida
        // A chave será o GTIN e o valor será a entidade Product
        const productsMap = new Map<string, Product>();
        for (const p of productsArray) {
            productsMap.set(p.gtin, p);
        }

        for (const item of products_gtins_quantities){

            const product: Product | undefined = productsMap.get(item.product_gtin);

            if (!product) throw new DomainError(`O produto com GTIN ${item.product_gtin} não foi encontrado.`)

            const random_ids: string[] = Array.from(
                { length: item.quantity }, 
                () => crypto.randomUUID()
            );

            bill = bill.addProduct(product, item.quantity, store_id, user_id, now_string, random_ids);
        }

        await this.billRepository.upsertBill(bill);

    }
}