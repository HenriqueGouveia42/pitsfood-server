import type { IProductRepository } from "../../repositories/product.repository.interface.js";
import { Product } from "../../entities/product.js";
import { Decimal } from "decimal.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import type { User } from "../../../user/entities/user.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

interface IRequest{
    name: string,
    unit_price_in_reais: Decimal,
    gtin_code: string | null,
    is_internal: boolean,
    active: boolean,
    store_id: string,
    track_stock: boolean,
    stock_quantity: number,
    user_id: string,
    requires_preparation: boolean
}
//store_id,
//track_stock,
//stock_quantity

export class CreateProductUseCase{

    constructor(
        private productRepository: IProductRepository,
        private userRepository: IUserRepository,
        private cacheProvider: ICacheProvider
    ) {}

    public async execute( { name, unit_price_in_reais, gtin_code, is_internal, active, store_id, track_stock, stock_quantity, user_id, requires_preparation }: IRequest ){
        
        if (!user_id) throw new AppError("id de usuario nao encontrado", 404, "USER_NOT_FOUND");
        const user: User | null = await this.userRepository.findSavedUserById(user_id)

        if (!user) throw new AppError("usuario nao encontrado", 404, "USER_NOT_FOUND");
        if(user.storeId != store_id) throw new AppError("Usuario nao pertence a loja", 404, "STORE_MISMATCH");

        const product: Product = Product.buildProduct(
            name,
            unit_price_in_reais,
            gtin_code,
            is_internal,
            active,
            store_id,
            track_stock,
            stock_quantity,
            requires_preparation
        );

        const productAlreadyExists = await this.productRepository.findSavedProductByGtinCode(
            product.gtin,
            store_id
        );

        if (productAlreadyExists){
            throw new AppError(`Ja existe um produto com o GTIN ${product.gtin} cadastrado nesta loja`, 4099, "PRODUCT_ALREADY_EXISTS")
        }

        await this.productRepository.saveProduct(product, store_id);

        //const cacheKey: string = `store-products:${store_id}`
        const cacheKey: string = CacheKeys.Product.LIST(store_id);

        await this.cacheProvider.invalidate(cacheKey);
        
    }
}