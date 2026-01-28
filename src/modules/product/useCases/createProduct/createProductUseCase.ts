import type { IProductRepository } from "../../repositories/product.repository.interface.js";
import { Product } from "../../entities/product.js";
import { Decimal } from "decimal.js"
import { AppError } from "../../../../shared/errors/AppError.js";

interface IRequest{
    name: string,
    unit_price_in_reais: Decimal,
    gtin_code: string | null,
    is_internal: boolean,
    active: boolean,
    store_id: string,
    track_stock: boolean,
    stock_quantity: number | null
}
//store_id,
//track_stock,
//stock_quantity

export class CreateProductUseCase{

    constructor(
        private productRepository: IProductRepository
    ) {}

    public async execute( { name, unit_price_in_reais, gtin_code, is_internal, active, store_id, track_stock, stock_quantity }: IRequest ){

        const product: Product = Product.buildProduct(
            name,
            unit_price_in_reais,
            gtin_code,
            is_internal,
            active,
            store_id,
            track_stock,
            stock_quantity
        );

        const productAlreadyExists = await this.productRepository.findSavedProductByGtinCode(
            product.gtin,
            store_id
        );

        if (productAlreadyExists){
            throw new AppError(`Ja existe um produto com o GTIN ${product.gtin} cadastrado nesta loja`, 4099, "PRODUCT_ALREADY_EXISTS")
        }

        await this.productRepository.saveProduct(product, store_id);
    }
}