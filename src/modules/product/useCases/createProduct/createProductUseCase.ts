import type { IProductRepository } from "../../repositories/product.repository.interface.js";
import { Product } from "../../entities/product.js";
import { Decimal } from "decimal.js"

interface IRequest{
    name: string,
    unit_price_in_reais: Decimal,
    gtin_code?: string,
    is_internal?: boolean,
    active?: boolean
}

export class CreateProductUseCase{

    constructor(
        private productRepository: IProductRepository
    ) {}

    public async execute( { name, unit_price_in_reais, gtin_code, is_internal, active }: IRequest ){

        const product: Product = Product.buildProduct(
            name,
            unit_price_in_reais,
            gtin_code,
            is_internal,
            active
        );

        await this.productRepository.saveProduct(product);
    }
}