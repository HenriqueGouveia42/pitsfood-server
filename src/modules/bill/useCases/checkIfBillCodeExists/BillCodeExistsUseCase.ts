import { AppError } from "../../../../shared/errors/AppError.js";
import type { Bill } from "../../entities/bill.js";
import type { IBillRepository } from "../../repositories/bill.repository.interface.js";

interface BillCode{
    bill_code_gtin: string
}

export class BillCodeExistsUseCase{

    constructor(
        private billRep: IBillRepository
    ){}

    async execute({ bill_code_gtin }: BillCode): Promise<boolean>{

        if(!bill_code_gtin){
            throw new AppError("Codigo GTIN da comanda ausente", 400, "GTIN_CODE_NOT_FOUND");
        }

        const exists: boolean = await this.billRep.billWithThisGtinCodeExists(bill_code_gtin);

        if(!exists){
            throw new AppError(`Comanda com o codigo: ${bill_code_gtin} nao existe`, 404, "BILL_NOT_FOUND")
        }

        return true;

    }

}