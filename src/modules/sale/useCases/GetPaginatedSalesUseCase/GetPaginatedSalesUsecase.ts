import type { ISaleRepository } from "../../repositories/interfaces/sale.repository.interface.js";
import { Sale } from "../../entities/sale.js";

export type GetPaginatedSalesUsecaseInputDTO = {
    store_id: string,
    page: number,
    limit: number
}

export type GetPaginatedSalesUsecaseOutputDTO = {
    sales: Sale[];
    meta: {
        current_page: number,
        limit: number,
        has_next_page: boolean
    }
}

export class GetPaginatedSalesUsecase{
    constructor(
        private saleRepository: ISaleRepository
    ){}

    public async execute({ store_id, page, limit }: GetPaginatedSalesUsecaseInputDTO): Promise<GetPaginatedSalesUsecaseOutputDTO>{

        const safePage: number = Math.max(1, page); //previne pagina negativa
        const safeLimit: number = Math.min(Math.max(1, limit), 100) //previne paginas acima de 100

        //se page = 1, limit = 15 -> skip = 0
        //se page = 2, limit = 15 -> skip = 15
        //se page = 3, limit = 15 -> skip = 30
        //...
        const skip: number = (safePage - 1) * safeLimit;

        const salesResult: Sale[] = await this.saleRepository.findPaginatedSales(store_id, skip, safeLimit);

        let hasNextPage: boolean = false;
        let finalSales: Sale[] = salesResult;

        if (salesResult.length > safeLimit) {
            hasNextPage = true

            finalSales = salesResult.slice(0, safeLimit);
        }

        const response: GetPaginatedSalesUsecaseOutputDTO = {
            sales: finalSales,
            meta: {
                current_page: safePage,
                limit: safeLimit,
                has_next_page: hasNextPage
            }
        }

        return response

    }
}