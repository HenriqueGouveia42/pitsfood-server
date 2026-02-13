import { Bill } from "../../entities/bill.js"
import { Product } from "../../../product/entities/product.js"
import type { IBillRepository } from "../../repositories/bill.repository.interface.js";
import type { IProductRepository } from "../../../product/repositories/product.repository.interface.js"
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js"
import { AppError } from "../../../../shared/errors/AppError.js";


type RequestDTO =  {
    bill_code_gtin: string;
    user_id: string;
    store_id: string;
    products_ids: string[];
}

export class BatchAddItemsUseCase {

    constructor(
        private billRepository: IBillRepository,
        private productRepository: IProductRepository,
        private userRepository: IUserRepository
    ) {}

    async execute({ bill_code_gtin, user_id, store_id, products_ids }: RequestDTO): Promise<void>{

        if(!products_ids || products_ids.length === 0) throw new AppError("Lista de ids de produtos ausente ou sem id's", 400, "LIST_ERROR");

        //verificamos se já existe uma comanda em uso "bill" com esse "bill_code_gtin"

        //se houver => adiciona item

        //se nao houve => instanciamos uma e ja adicionamos esses itens


    }
}