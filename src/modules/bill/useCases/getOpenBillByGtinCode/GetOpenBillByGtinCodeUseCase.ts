import { AppError } from "../../../../shared/errors/AppError.js";
import type { Bill } from "../../entities/bill.js";
import type { IBillRepository } from "../../repositories/interfaces/bill.repository.interface.js";

export interface BillItemDTO {
    product_name: string;
    product_gtin_code: string;
    unit_price: number;
    quantity: number;
    total: number;
}

export interface GetOpenBillResponseDTO {
    bill_id: string;
    bill_code: string;
    total_bill: number;
    items: BillItemDTO[];
}

export class GetOpenBillByGtinCodeUseCase {

    constructor(
        private billRepository: IBillRepository
    ) {}

    async execute(bill_code_gtin: string, store_id: string): Promise<GetOpenBillResponseDTO> {
        
        const openBill: Bill | null = await this.billRepository.getOpenBillByCode(bill_code_gtin, store_id);

        if (!openBill) {
            const billExists: boolean = await this.billRepository.physicalBillWithThisGtinCodeExists(bill_code_gtin, store_id);

            if (billExists) {
                throw new AppError(`A comanda ${bill_code_gtin} existe, mas não está com o status ABERTA.`, 409, "BILL_CONFLICT");
            }

            throw new AppError(`Comanda ${bill_code_gtin} não encontrada.`, 404, "BILL_NOT_FOUND");
        }

        // como a entidade guarda cada bip como um registro separado, precisamos somar as quantidades.
        const itemsMap = new Map<string, BillItemDTO>();

        for (const item of openBill.items) {
            const unitPriceNumber = item.price_at_addition.toNumber();
            // chave composta para agrupar o mesmo produto com o mesmo preço
            const groupKey = `${item.product_gtin_code}-${unitPriceNumber}`; 

            if (itemsMap.has(groupKey)) {
                const existingItem = itemsMap.get(groupKey)!;
                existingItem.quantity += 1;
                existingItem.total = Number((existingItem.unit_price * existingItem.quantity).toFixed(2));
            } else {
                itemsMap.set(groupKey, {
                    product_name: item.product_name,
                    product_gtin_code: item.product_gtin_code,
                    unit_price: unitPriceNumber,
                    quantity: 1,
                    total: unitPriceNumber
                });
            }
        }

        const itemsFormatted: BillItemDTO[] = Array.from(itemsMap.values());

        // retorna o DTO Completo
        return {
            bill_id: openBill.bill_id,
            bill_code: openBill.bill_code,
            total_bill: Number(itemsFormatted.reduce((acc, item) => acc + item.total, 0).toFixed(2)),
            items: itemsFormatted
        };
    }
}