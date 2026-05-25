import { AppError } from "../../../shared/errors/AppError.js";
import { DomainError } from "../../../shared/errors/DomainError.js";
import type { IUnitOfWork, ITransactionRepositories } from "../../../shared/infra/uow/interface/uow.interface.js";
import { Bill, type BuildBillProps } from "../entities/bill.js";
import type { Product } from "../../product/entities/product.js";
import type { PhysicalBill } from "../entities/physicalBIllCard.js";

type AdditionRepos = Pick<ITransactionRepositories, 
    "billRepository" | "physicalBillRepository" | "productRepository"
>;

type product_gtin_quantity = {
    product_gtin: string,
    quantity: number
}

export interface IBatchAddItemsRequest {
    bill_code_gtin: string;
    user_id: string;
    store_id: string;
    products_gtins_quantities: product_gtin_quantity[];
}

export class BillAdditionService {
    
    constructor(private uow: IUnitOfWork) {}

    async execute({ bill_code_gtin, user_id, store_id, products_gtins_quantities }: IBatchAddItemsRequest): Promise<void> {
        
        if(!products_gtins_quantities || products_gtins_quantities.length === 0) 
            throw new AppError("Lista de pares gtin-quantidade vazia ou nula", 400, "EMPTY_LIST");

        await this.uow.transaction<void, AdditionRepos>(async (repositories) => {
            
            const physicalBillCardExists: boolean = await repositories.physicalBillRepository.existsByCode(bill_code_gtin, store_id);
            if (!physicalBillCardExists) throw new AppError(`Não existe uma comanda física de número ${bill_code_gtin} no sistema`);

            const billArray: Bill | null = await repositories.billRepository.getOpenBillByCode(bill_code_gtin, store_id);
            let bill: Bill
            const now_string = new Date().toISOString();

            
            if (!billArray) { // Se for null
                const bill_id = crypto.randomUUID();
                const build_props: BuildBillProps = {
                    bill_id,
                    bill_code_gtin,
                    store_id,
                    now_string
                };
                bill = Bill.buildOpenedBill(build_props);
            } else {
                bill = billArray; // Já é a entidade
            }

            const gtinsToFetch = products_gtins_quantities.map(item => item.product_gtin);
            const productsArray = await repositories.productRepository.findManySavedProductsByGtinCodes(gtinsToFetch, store_id);
            
            if (gtinsToFetch.length !== productsArray.length) 
                throw new AppError("Algum produto solicitado não existe ou está indisponível", 400, "PRODUCT_NOT_FOUND");

            const productsMap = new Map<string, Product>();
            for (const p of productsArray) productsMap.set(p.gtin, p);

            for (const item of products_gtins_quantities) {
                const product = productsMap.get(item.product_gtin);
                if (!product) throw new DomainError(`O produto com GTIN ${item.product_gtin} não foi encontrado no Map.`);

                const random_ids = Array.from({ length: item.quantity }, () => crypto.randomUUID());
                bill = bill.addProduct(product, item.quantity, store_id, user_id, now_string, random_ids);
            }

            await repositories.billRepository.upsertBill(bill);
        });
    }
}