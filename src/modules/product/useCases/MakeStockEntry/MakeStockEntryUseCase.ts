import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import type { IProductRepository } from "../../repositories/interfaces/product.repository.interface.js";
import { User, UserRole } from "../../../user/entities/user.js";
import { Store } from "../../../store/entities/store.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { Product } from "../../entities/product.js";
import { Decimal } from "decimal.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

interface MakeStockEntryUseCaseRequestDTO{
    user_id: string,
    store_id: string,
    product_id: string | undefined,
    entry_stock_quantity: number,
    unit_cost: string
}

export interface MakeStockEntryUseCaseResponseDTO{
    user_name: string
}

export class MakeStockEntryUseCase{
    constructor(
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository,
        private productRepository: IProductRepository,
        private cacheProvider: ICacheProvider
    ){}

    public async execute( {user_id, store_id, product_id, entry_stock_quantity, unit_cost}: MakeStockEntryUseCaseRequestDTO ): Promise<MakeStockEntryUseCaseResponseDTO>{

        if(product_id === undefined) throw new AppError("Falta o id do produto", 400, "PRODUCT_ID_MISSING");

        if(entry_stock_quantity <= 0 || entry_stock_quantity > 100000000){
            throw new AppError("Quantidade deve ser maior que 1 e menor de 10 milhoes", 400, "INVALID_QUANTITY");
        }

        const unit_cost_Decimal: Decimal = new Decimal(unit_cost);
        if(unit_cost_Decimal.lessThanOrEqualTo(0.01)){
            throw new AppError("Preco unitario deve ser maior que 1 centavo", 400, "PRICE_TOO_LOW");
        }

        const user_trying_to_make_entry: User | null = await this.userRepository.findSavedUserById(user_id);
        if(!user_trying_to_make_entry) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        if (user_trying_to_make_entry.role != UserRole.GESTOR) throw new AppError("Usuario nao é gestor", 403, "FORBIDEN");
        
        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");

        const isStoreOwner: boolean = store.ownerId === user_trying_to_make_entry.id;
        const isAssignedGestor: boolean = user_trying_to_make_entry.storeId === store.id

        if(!isStoreOwner && !isAssignedGestor){
            throw new AppError("Usuario gestor nao pertence a essa loja", 403, "STORE_MISMATCH");
        }

        const product_to_be_updated: Product | null = await this.productRepository.findSavedProductById(product_id, store_id);
        if (!product_to_be_updated) throw new AppError("Produto nao encontrado", 404, "PRODUCT_NOT_FOUND");
        if (product_to_be_updated.store_id !== user_trying_to_make_entry.storeId) throw new AppError("Produto nao é da mesma loja do usuario", 403, "USER_STORE_MISMATCH")
        
        if (!product_to_be_updated.active) throw new AppError("Produto inativo nao pode ter entrada de estoque", 400, "DEACTIVATED_PRODUCT");

        // BLINDAGEM CONTRA INTEGER OVERFLOW
        const MAX_INT_POSTGRES = 2147483647;
        if ((product_to_be_updated.stock_quantity + entry_stock_quantity) > MAX_INT_POSTGRES) {
            throw new AppError("A capacidade máxima de estoque para este produto foi atingida", 400, "STOCK_OVERFLOW");
        }

        if (!product_to_be_updated.track_stock) throw new AppError("Produto nao tem controle de estoque", 400, "PRODUCT_DONT_HAVE_TRACK_STOCK");

        const total_cost: Decimal = new Decimal(entry_stock_quantity).times(new Decimal(unit_cost));

        await this.productRepository.makeEntryStock(product_id, store_id, user_trying_to_make_entry.id, user_trying_to_make_entry.username, entry_stock_quantity, unit_cost_Decimal, total_cost);

        const cacheKey: string = CacheKeys.Product.LIST(store_id);
        await this.cacheProvider.invalidate(cacheKey);

        return {
            user_name: user_trying_to_make_entry.username
        }

    }
}