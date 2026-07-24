import type { IBillRepository } from "../../repositories/bill.repository.interface.js";
import { PhysicalBill } from "../../entities/physicalBIllCard.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

type RequestDTO = {
    store_id: string
}

type ResponseDTO = {
    codes: string[]
}

export class GetPhysicalBIllCodesUseCase{

    constructor(
        private billRepository: IBillRepository,
        private cacheProvider: ICacheProvider
    ){}

    public async execute({ store_id }: RequestDTO): Promise<ResponseDTO>{

        const cacheKey: string = CacheKeys.Store.PHYSICAL_BILLS_CODES(store_id);

        let physical_bills_codes: string[] | null = [];

        physical_bills_codes = await this.cacheProvider.get(cacheKey);

        if (physical_bills_codes){
            return {
                codes: physical_bills_codes
            }
        }

        const physical_bills: PhysicalBill[] | null = await this.billRepository.getPhysicalBills(store_id);

        if (!physical_bills) throw new AppError("Algo com errado com a loja, as comandas nao foram geradas");

        physical_bills_codes = physical_bills.map(phy => (
            phy.code
        ))

        await this.cacheProvider.save(cacheKey, physical_bills_codes, 86400);

        return{
            codes: physical_bills_codes
        }

    }
}