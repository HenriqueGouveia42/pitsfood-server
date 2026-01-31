import type { IProductRepository } from "../../repositories/product.repository.interface.js";

interface ListStockEntriesUseCaseRequestDTO{
    store_id: string
}

interface ListStockEntriesUseCaseResponseDTO{
    date: string,
    user_id: string,
    user_name:string,
    product_id: string,
    product_name: string,
    quantity_entered: number,
    unit_cost: string,
    total_amount: string
}

export class ListStockEntriesUseCase{
    constructor(
        private productRepository: IProductRepository
    ){}

    public async execute( {store_id}: ListStockEntriesUseCaseRequestDTO ): ListStockEntriesUseCaseResponseDTO {
        
    }
}