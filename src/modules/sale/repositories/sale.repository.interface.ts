import { Sale } from "../entities/sale.js";

export interface ISaleRepository {
    makeSale(sale: Sale): Promise<void>;
    findSavedSaleById(sale_id: string): Promise<Sale>;
    listSavedSales(): Promise<Sale[]>;
    deleteSavedSaleById(sale_id: string): Promise<void>;
    createSaleAndCloseBills(sale: Sale, billCodesToClose: string[]): Promise<void>;
}
