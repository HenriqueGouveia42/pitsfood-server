import type { IProductRepository } from "../../repositories/interfaces/product.repository.interface.js";
import { Product } from "../../entities/product.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import { UserRole } from "../../../user/entities/user.js";

export interface IGetAllProductsResponse {
    name: string;
    unit_price_in_reais: number; // Convertido para primitivo para sobreviver ao Redis
    gtin_code: string;
    is_internal: boolean;
    is_active: boolean;
    track_stock: boolean;
    stock_quantity: number;
    requires_preparation: boolean;
    product_id: string;
    product_icon_url: string | null
}

interface IGetAllProductsRequest {
    store_id: string;
    user_role: UserRole;
}

export class GetAllProductsUseCase {

    constructor(
        private productRepository: IProductRepository,
        private cacheProvider: ICacheProvider
    ) {}

    public async execute({ store_id, user_role }: IGetAllProductsRequest): Promise<IGetAllProductsResponse[]> {

        
        // Se o usuário for um GESTOR, ignoramos o cache
        if (user_role === UserRole.GESTOR) {
            const products = await this.productRepository.listSavedProducts(store_id);
            return this.mapToDTO(products);
        }

        // Se o usuário não for um GESTOR, tentamos utilzar o cache
        const cacheKey: string = CacheKeys.Product.LIST(store_id);
        const cachedData = await this.cacheProvider.get<IGetAllProductsResponse[]>(cacheKey);

        if (cachedData) return cachedData;
        
        // Cache miss
        const products: Product[] = await this.productRepository.listSavedProducts(store_id);
        const allProductsResponse: IGetAllProductsResponse[] = this.mapToDTO(products);

        // Salva por 1 hora (3600s). Essa chave só será invalidade se um produto for criado/editado/deletado.
        await this.cacheProvider.save(cacheKey, allProductsResponse, 3600);

        return allProductsResponse;
    }

    private mapToDTO(products: Product[]): IGetAllProductsResponse[] {
        return products.map(p => ({
            name: p.name,
            unit_price_in_reais: p.price.toNumber(), //Limpa o Decimal transformando em Number
            gtin_code: p.gtin,
            is_internal: p.isInternal,
            is_active: p.active,
            track_stock: p.track_stock,
            stock_quantity: p.stock_quantity,
            requires_preparation: p.requires_preparation,
            product_id: p.id,
            product_icon_url: p.product_icon_url
        }));
    }
}