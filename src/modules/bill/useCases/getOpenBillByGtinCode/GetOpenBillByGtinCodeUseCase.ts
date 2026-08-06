import { AppError } from "../../../../shared/errors/AppError.js";
import type { Bill } from "../../entities/bill.js";
import type { IBillRepository } from "../../repositories/interfaces/bill.repository.interface.js";


export interface BillItemDTO {
    bill_item_id: string;    
    product_id: string;
    name: string;             
    gtin_code: string;      
    unit_price: number;
    user_id: string;
    created_at: string;
    active: boolean;                         
    deactivated_by_user_id: string | null;
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

        // 1. Calcula o total da comanda SOMENTE com os itens ativos
        const billTotal = openBill.items
            .filter(item => item.active === true)
            .reduce((sum, item) => sum + item.price_at_addition.toNumber(), 0);

        // 2. Mapeia todos os itens (ativos e inativos) em uma lista plana, sem agrupar
        const itemsFormatted: BillItemDTO[] = openBill.items.map(item => ({
            bill_item_id: item.bill_item_id,
            product_id: item.product_id,
            name: item.product_name,
            gtin_code: item.product_gtin_code,
            unit_price: item.price_at_addition.toNumber(),
            user_id: item.user_id,
            created_at: item.created_at,
            active: item.active,
            deactivated_by_user_id: item.deactivated_by_user_id
        }));

        // 3. Retorna o DTO Completo
        return {
            bill_id: openBill.bill_id,
            bill_code: openBill.bill_code,
            total_bill: Number(billTotal.toFixed(2)),
            items: itemsFormatted
        };
    }
}