import { AppError } from "../../../../shared/errors/AppError.js";
import { Bill } from "../../entities/bill.js";
import type { IBillRepository } from "../../repositories/bill.repository.interface.js";

// DTO do Item (Formato para o JSON)
export interface BillItemDTO {
    product_name: string;
    product_gtin_code: string;
    unit_price: number;
    quantity: number;
    total: number;
}

// DTO da Resposta Completa (Geralmente retornamos os dados da comanda + itens)
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

    async execute(bill_code_gtin: string): Promise<GetOpenBillResponseDTO> {
        
        const openBill: Bill | null = await this.billRepository.findOpenBillByGtinCode(bill_code_gtin);

        if (!openBill) {
            // Verifica se a comanda existe mas está fechada/cancelada
            const billExists: boolean = await this.billRepository.billWithThisGtinCodeExists(bill_code_gtin);

            if (billExists) {
                throw new AppError(`Comanda ${bill_code_gtin} existe, mas não está ABERTA!`, 409, "BILL_CONFLICT");
            }

            throw new AppError(`Comanda ${bill_code_gtin} não encontrada`, 404, "BILL_NOT_FOUND");
        }

        const itemsFormatted: BillItemDTO[] = openBill.items.map(item => {
            
            const unitPriceNumber = item.price_at_addition.toNumber();
            const totalItemValue = item.price_at_addition.times(item.quantity).toNumber();

            return {
               
                product_name: item.product_name,
                product_gtin_code: item.product_gtin_code,
                unit_price: unitPriceNumber, 
                quantity: item.quantity,
                total: totalItemValue
            };
        });

        // Retorna o objeto completo formatado
        return {
            bill_id: openBill.bill_id,
            bill_code: openBill.bill_code,
            // Calcula o total geral da comanda somando os itens formatados
            total_bill: itemsFormatted.reduce((acc, item) => acc + item.total, 0),
            items: itemsFormatted
        };
    }
}