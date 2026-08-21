import type { IProductRepository } from "../../repositories/interfaces/product.repository.interface.js";
import { Product } from "../../entities/product.js";
import { Decimal } from "decimal.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import type { User } from "../../../user/entities/user.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { BuildProductProps } from "../../entities/product.js";
import type { Store } from "../../../store/entities/store.js";
import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";

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
        private cacheProvider: ICacheProvider,
        private storeRepository: IStoreRepository
    ) {}

    public async execute( { name, unit_price_in_reais, gtin_code, is_internal, active, store_id, track_stock, stock_quantity, user_id, requires_preparation }: IRequest ){
        
        if (!user_id) throw new AppError("id de usuario nao encontrado", 404, "USER_NOT_FOUND");
        const user: User | null = await this.userRepository.findSavedUserById(user_id)

        if (!user) throw new AppError("usuario nao encontrado", 404, "USER_NOT_FOUND");

        const store: Store | null  = await this.storeRepository.findSavedStoreById(store_id);
        if(!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");
        
        // Usuário não é o dono da loja e nem é usuário pago
        if((user.id != store.ownerId) && user.paying_user) throw new AppError("Usuario nao pertence a loja", 404, "STORE_MISMATCH");

        const now_date: string = new Date().toISOString();
        const product_id: string = crypto.randomUUID();
        
        const props_build: BuildProductProps = {
            name: name,
            unit_price_in_reais: unit_price_in_reais,
            gtin_code: gtin_code,
            is_internal: is_internal,
            active: active,
            store_id: store_id,
            track_stock: track_stock,
            stock_quantity: stock_quantity,
            requires_preparation: requires_preparation,
            now_date: now_date,
            product_id: product_id
        }

        const product: Product = Product.buildProduct(props_build);

        const productAlreadyExists = await this.productRepository.findSavedProductByGtinCode(
            product.gtin,
            store_id
        );

        if (productAlreadyExists) throw new AppError(`Ja existe um produto com o GTIN ${product.gtin} cadastrado nesta loja`, 4099, "PRODUCT_ALREADY_EXISTS")
    
        await this.productRepository.saveProduct(product, store_id);

        const cacheKey: string = CacheKeys.Product.LIST(store_id);

        await this.cacheProvider.invalidate(cacheKey);
        
    }
}