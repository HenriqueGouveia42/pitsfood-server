import { AppError } from "../../../../shared/errors/AppError.js";
import type { Bill } from "../../entities/bill.js";
import type { IBillRepository } from "../../repositories/interfaces/bill.repository.interface.js";

type RequestDTO = {
    store_id: string,
    gtin_code: string
}

export class BillCodeExistsUseCase{

    constructor(
        private billRep: IBillRepository
    ){}

    async execute({ store_id, gtin_code }: RequestDTO): Promise<boolean>{

        if(!gtin_code) throw new AppError("Codigo GTIN da comanda ausente", 400, "GTIN_CODE_NOT_FOUND");
        
        const exists: boolean = await this.billRep.physicalBillWithThisGtinCodeExists(gtin_code, store_id);

        if(!exists) return false
        
        return true;

    }

}