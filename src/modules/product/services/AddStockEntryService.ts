// src/modules/product/services/AddStockEntryService.ts

import { AppError } from "../../../shared/errors/AppError.js";
import type { IUnitOfWork, ITransactionRepositories } from "../../../shared/infra/uow/interface/uow.interface.js";
import { StockEntry } from "../entities/stock-entry.js";
import { Decimal } from "decimal.js";

// Restringe o UoW apenas aos repositórios necessários para esta transação
type AddStockRepos = Pick<ITransactionRepositories, "productRepository" | "stockEntryRepository">;

export interface IAddStockEntryRequest {
    product_id: string;
    store_id: string;
    user_id: string;
    user_name: string;
    quantity: number;
    unit_cost: Decimal;
    total_cost: Decimal;
}

export class AddStockEntryService {
    
    constructor(private uow: IUnitOfWork) {}

    async execute(request: IAddStockEntryRequest): Promise<void> {
        
        // Fail-fast básico
        if (request.quantity <= 0) {
            throw new AppError("A quantidade de entrada deve ser maior que zero.", 400, "INVALID_QUANTITY");
        }

        await this.uow.transaction<void, AddStockRepos>(async (repositories) => {
            
            // 1. Busca o produto para validar se existe na loja e pegar o nome atual
            const product = await repositories.productRepository.findSavedProductById(
                request.product_id, 
                request.store_id
            );

            if (!product) {
                throw new AppError("Produto não encontrado na loja especificada.", 404, "PRODUCT_NOT_FOUND");
            }

            if (!product.active) {
                throw new AppError("Produto inativo nao pode ter entrada de estoque", 400, "DEACTIVATED_PRODUCT");
            }

            if (!product.track_stock) {
                throw new AppError("Produto nao tem controle de estoque", 400, "PRODUCT_DONT_HAVE_TRACK_STOCK");
            }

            // BLINDAGEM CONTRA INTEGER OVERFLOW
            const MAX_INT_POSTGRES = 2147483647;
            if ((product.stock_quantity + request.quantity) > MAX_INT_POSTGRES) {
                throw new AppError("A capacidade máxima de estoque para este produto foi atingida", 400, "STOCK_OVERFLOW");
            }

            // 2. Instancia a Entidade de Registro de Estoque
            const entry_id = crypto.randomUUID();
            const now_string = new Date().toISOString();

            // Nota: Conforme conversamos, assumo que você adicionou "user_id" 
            // às propriedades do StockEntryProps na sua entidade.
            const newStockEntry = StockEntry.restore({
                entry_id: entry_id,
                product_id: request.product_id,
                store_id: request.store_id,
                user_id: request.user_id, // Adicionado para persistência correta
                user_name: request.user_name,
                product_name: product.name, // Nome do produto "congelado" na época da entrada
                quantity: request.quantity,
                unit_cost: request.unit_cost,
                total_cost: request.total_cost,
                created_at: now_string
            } as any); // Usando 'as any' temporariamente caso a interface ainda não tenha sido atualizada

            // 3. Persistência Atômica (O Tudo ou Nada)
            
            // Salva a linha de histórico na tabela stock_entries
            await repositories.stockEntryRepository.save(newStockEntry);

            // Incrementa o contador na tabela products
            await repositories.productRepository.incrementProductStock(
                request.product_id, 
                request.store_id, 
                request.quantity
            );
            
        });
    }
}