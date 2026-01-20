import type { IProductRepository } from "../../repositories/product.repository.interface.js";
import { Product } from "../../entities/product.js";
import type { Decimal } from "decimal.js"

/*
    name
    unit_price_in_reais
    gtin_code 
*/

export interface IGetAllActiveProductsResponse{
    name: string,
    unit_price_in_reais: Decimal,
    gtin_code: string
}

export class GetAllActiveProductsUseCase{

    constructor(
        private productRepository: IProductRepository
    ) {}

    public async execute(): Promise<IGetAllActiveProductsResponse[]> {

        const products: Product[] = await this.productRepository.listSavedProducts(true);

        const allActiveProductsResponse: IGetAllActiveProductsResponse[] = products.map(p =>({
            name: p.name,
            unit_price_in_reais:p.price,
            gtin_code: p.gtin
        }))

        return allActiveProductsResponse

    }
};