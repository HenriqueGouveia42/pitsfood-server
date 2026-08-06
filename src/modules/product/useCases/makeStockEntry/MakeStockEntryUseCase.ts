// src/modules/product/useCases/MakeStockEntry/MakeStockEntryUseCase.ts

import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import { UserRole } from "../../../user/entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { Decimal } from "decimal.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { AddStockEntryService } from "./services/AddStockEntryService.js";

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

export class MakeStockEntryUseCase {
    constructor(
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository,
        private addStockEntryService: AddStockEntryService,
        private cacheProvider: ICacheProvider
    ){}

    public async execute({ user_id, store_id, product_id, entry_stock_quantity, unit_cost }: MakeStockEntryUseCaseRequestDTO): Promise<MakeStockEntryUseCaseResponseDTO> {

        // 1. Validações HTTP Básicas (Fail-Fast)
        if(!product_id) throw new AppError("Falta o id do produto", 400, "PRODUCT_ID_MISSING");

        if(entry_stock_quantity <= 0 || entry_stock_quantity > 100000000){
            throw new AppError("Quantidade deve ser maior que 1 e menor de 10 milhoes", 400, "INVALID_QUANTITY");
        }

        const unit_cost_Decimal = new Decimal(unit_cost);
        if(unit_cost_Decimal.lessThanOrEqualTo(0.01)){
            throw new AppError("Preco unitario deve ser maior que 1 centavo", 400, "PRICE_TOO_LOW");
        }

        // 2. Autorização (Cross-Domain)
        const user = await this.userRepository.findSavedUserById(user_id);
        if(!user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        if (user.role !== UserRole.GESTOR) throw new AppError("Usuario nao é gestor", 403, "FORBIDEN");
        
        const store = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");

        const isStoreOwner = store.ownerId === user.id;
        const isAssignedGestor = user.storeId === store.id;

        if(!isStoreOwner && !isAssignedGestor){
            throw new AppError("Usuario gestor nao pertence a essa loja", 403, "STORE_MISMATCH");
        }

        // 3. Orquestração e Delegação
        const total_cost = new Decimal(entry_stock_quantity).times(unit_cost_Decimal);

        await this.addStockEntryService.execute({
            product_id,
            store_id,
            user_id: user.id,
            user_name: user.username,
            quantity: entry_stock_quantity,
            unit_cost: unit_cost_Decimal,
            total_cost: total_cost
        });

        // 4. Efeitos Colaterais (Fora da Transação)
        const cacheKey = CacheKeys.Product.LIST(store_id);
        await this.cacheProvider.invalidate(cacheKey);

        return {
            user_name: user.username
        };
    }
}