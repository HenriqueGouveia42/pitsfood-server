import { PrismaBillRepository } from "../../repositories/implementations/prisma/bill.repository.prisma.js";
import { Bill } from "../../entities/bill.js"
import type { billStates } from "../../entities/bill.js";

interface BillItemDTO {
   name: string,
   unit_price_at_sold: number,
   gtin_code: string,
   quantity: number,
   total: number
}

interface toControllerBillDTO {
    bill_code_gtin: string,
    status: billStates,
    products: BillItemDTO[]
}

export class FindAllOpenBillsUseCase{

    constructor(
        private billRepository: PrismaBillRepository
    ){}

    public async execute(): Promise<toControllerBillDTO[]>{

        const bills: Bill[] = await this.billRepository.findAllOpenBills();

        return bills.map(bill => ({
            bill_code_gtin: bill.bill_code,
            status:bill.status,
            products: bill.items.map(item => ({
                name: item.product_name,
                unit_price_at_sold: item.price_at_addition.toNumber(),
                gtin_code: item.product_gtin_code,
                quantity:item.quantity,
                total: item.price_at_addition.times(item.quantity).toNumber()
            }))
        }))

      

    }

}
