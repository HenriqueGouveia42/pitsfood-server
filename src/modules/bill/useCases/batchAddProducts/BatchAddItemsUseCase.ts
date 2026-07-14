import type { BillAdditionService, IBatchAddItemsRequest } from "../../services/BillAdditionService.js";

export class BatchAddItemsUseCase {

    constructor(
        private billAdditionService: BillAdditionService 
    ) {}

    async execute(request: IBatchAddItemsRequest): Promise<void> {

        await this.billAdditionService.execute(request);
        
    }
}