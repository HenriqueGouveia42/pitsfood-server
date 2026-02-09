import type { IProductRepository } from "../../repositories/product.repository.interface.js";
import { Product } from "../../entities/product.js";
import { Decimal } from "decimal.js"
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";

/*
    name
    unit_price_in_reais
    gtin_code 
*/

export interface IGetAllProductsResponse{
    name: string,
    unit_price_in_reais: Decimal,
    gtin_code: string,
    is_internal: boolean,
    is_active: boolean,
    track_stock: boolean,
    stock_quantity: number,
    requires_preparation: boolean,
    product_id: string
}

interface IGetAllProductsRequest{
    store_id: string
}

export class GetAllProductsUseCase{


    constructor(
        private productRepository: IProductRepository,
        private cacheProvider: ICacheProvider
    ) {}

    public async execute({ store_id }: IGetAllProductsRequest): Promise<IGetAllProductsResponse[]> {

        const cacheKey: string = `store-products:${store_id}`;

        //const cachedData = await this.cacheProvider.get<any[]>(cacheKey);

        //if (cachedData){
        //    return cachedData.map(item =>({
        //        ...item,
        //        unit_price_in_reais: new Decimal(item.unit_price_in_reais)            }))
        //}

        const products: Product[] | [] = await this.productRepository.listSavedProducts(store_id);

        const allProductsResponse: IGetAllProductsResponse[] = products.map(p =>({
            name: p.name,
            unit_price_in_reais:p.price,
            gtin_code: p.gtin,
            is_internal: p.isInternal,
            is_active: p.active,
            track_stock: p.track_stock,
            stock_quantity: p.stock_quantity,
            requires_preparation: p.requires_preparation,
            product_id: p.id
        }))

        await this.cacheProvider.save(cacheKey, allProductsResponse, 3600)

        return allProductsResponse

    }
};