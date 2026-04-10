import type { IProductRepository } from "../../repositories/interfaces/product.repository.interface.js";
import { Product } from "../../entities/product.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
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

        //FLUXO DO GESTOR (Bypass de Cache)
        //O Gestor precisa ver o estoque atualizado em tempo real. Ignoramos o Redis.
        if (user_role === UserRole.GESTOR) {
            const products = await this.productRepository.listSavedProducts(store_id);
            return this.mapToDTO(products);
        }

        //FLUXO DO CAIXA/VENDEDOR (Usa o Cache)
        const cacheKey: string = CacheKeys.Product.LIST(store_id);
        const cachedData = await this.cacheProvider.get<IGetAllProductsResponse[]>(cacheKey);

        if (cachedData) return cachedData;
        
        //CACHE MISS
        const products: Product[] = await this.productRepository.listSavedProducts(store_id);
        const allProductsResponse: IGetAllProductsResponse[] = this.mapToDTO(products);

        //Salva por 1 hora (3600s). Nenhuma venda vai invalidar essa chave!
        //Ela só será invalidada se um produto for criado/editado/deletado.
        await this.cacheProvider.save(cacheKey, allProductsResponse, 3600);

        return allProductsResponse;
    }

    //Método auxiliar para evitar repetição de código (DRY)
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
            product_id: p.id
        }));
    }
}