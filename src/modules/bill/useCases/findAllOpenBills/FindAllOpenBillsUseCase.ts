import type { IBillRepository } from "../../repositories/bill.repository.interface.js";
import { type Bill, type billStates } from "../../entities/bill.js";

// =============================================================================
// DTOs (Data Transfer Objects) - Estrutura Plana (Raw Data)
// =============================================================================

// Representa um item individual (uma linha no banco)
export interface OpenBillItemDTO {
   bill_item_id: string;    // ID único deste item específico
   product_id: string;
   name: string;
   gtin_code: string;
   unit_price: number;      // Preço deste item específico
   user_id: string;         // Quem pediu (útil para o front mostrar a foto do garçom)
   created_at: string;      // Hora exata do pedido (útil para ordenar timeline)
}

// Representa a Comanda
export interface OpenBillDTO {
    bill_id: string;
    bill_code: string;      // O número da comanda física (Ex: "3283")
    status: billStates;
    total_amount: number;   // O servidor ainda calcula o total geral para facilitar a listagem
    opened_at: string;      // Data de criação da comanda
    items: OpenBillItemDTO[]; // Lista plana, sem agrupamento
}

export class FindAllOpenBillsUseCase {

    constructor(
        private billRepository: IBillRepository
    ){}

    public async execute(store_id: string): Promise<OpenBillDTO[]> {

        const bills: Bill[] = await this.billRepository.findAllOpenBills(store_id);

        const resultDTO: OpenBillDTO[] = bills.map(bill => {
            
            const billTotal = bill.items.reduce((sum, item) => sum + item.price_at_addition.toNumber(), 0);

            return {
                bill_id: bill.bill_id,
                bill_code: bill.bill_code,
                status: bill.status,
                total_amount: Number(billTotal.toFixed(2)),
                opened_at: bill.createdAt,
                
                items: bill.items.map(item => ({
                    bill_item_id: item.bill_item_id,
                    product_id: item.product_id,
                    name: item.product_name,
                    gtin_code: item.product_gtin_code,
                    unit_price: item.price_at_addition.toNumber(),
                    user_id: item.user_id,
                    created_at: item.created_at
                }))
            };
        });

        return resultDTO;
    }
}