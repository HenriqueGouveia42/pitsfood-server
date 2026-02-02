import { AppError } from "../../../../shared/errors/AppError.js";
import { UserRole } from "../../../user/entities/user.js"; //Enum
import type { IProductRepository } from "../../repositories/product.repository.interface.js";
import { StockEntry } from "../../entities/stock-entry.js";
import type { number } from "zod";
import { Product } from "../../entities/product.js";

interface RequestDTO{
    store_id: string,
    user_role: UserRole,
    page: number,
    items_per_page: number,
    product_id?: string | undefined
}

type EntryDataResponse = {
    entry_id: string,
    product_id: string,
    product_name: string,
    user_name: string,
    unit_cost: string,
    quantity: number,
    total_cost: string
}

type ResponseDTO = {
    entries: EntryDataResponse[],
    total_count: number
}



export class ListStockEntriesUseCase {
    constructor(
        private productRepository: IProductRepository,
    ){}

    public async execute({ store_id, user_role, page, items_per_page, product_id }: RequestDTO): Promise<ResponseDTO> {
        
        if (user_role !== UserRole.GESTOR) {
            throw new AppError("Apenas gestores podem visualizar o histórico de estoque", 403, "UNAUTHORIZED_ROLE");
        }

        if (!store_id) {
            throw new AppError("ID da loja inválido no token", 401, "INVALID_TOKEN_DATA");
        }

        const result = await this.productRepository.listStockEntries(store_id, page, items_per_page, product_id);

        const entries: StockEntry[] = result.entries;
        const total_count: number = result.total_count;

        const entries_response: EntryDataResponse[] = entries.map(e =>({
            entry_id: e.id,
            product_id: e.product_id,
            product_name: e.productName,
            user_name: e.userName,
            unit_cost: e.unitCost.toString(),
            quantity: e.quantity,
            total_cost: e.totalCost.toString()
        }))

        const finalResponse: ResponseDTO = {
            entries: entries_response,
            total_count
        }

        return finalResponse

    }
}