import { Bill } from "../../entities/bill.js"
import type { IBillRepository } from "../../repositories/bill.repository.interface.js";

export class GetOpenBillByGtinCodeUseCase{

    constructor(
        private billRepository: IBillRepository
    ) {}

    async execute(bill_code_gtin: string): Promise<Bill> {
        
        const openBill: Bill = await this.billRepository.findOpenBillByGtinCode(bill_code_gtin);

        return openBill;

    }
}