import { Bill } from "../../entities/bill.js"
import type { IBillRepository } from "../../repositories/bill.repository.interface.js";

export class GetOpenBillByGtinCodeUseCase{

    constructor(
        private billRepository: IBillRepository
    ) {}

    async execute(bill_code_gtin: string): Promise<Bill> {
        
        const openBill: Bill | null = await this.billRepository.findOpenBillByGtinCode(bill_code_gtin);

        if(!openBill){

            const billExists: boolean = await this.billRepository.billWithThisGtinCodeExists(bill_code_gtin);

            if (billExists){
                throw new Error(`Comanda com gtin_code: ${bill_code_gtin} existe, mas não está aberta!`)
            }

            throw new Error(`Comanda com gtin_code: ${bill_code_gtin} não existe no sistema`)
        }

        return openBill;

    }
}