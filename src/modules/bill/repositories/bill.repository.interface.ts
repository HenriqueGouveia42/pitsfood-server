import type { Bill } from "../entities/bill.js";

export interface IBillRepository {
    createOpenBill(bill: Bill): Promise<void>; //uso para seeding do banco de dados
    createOpenBillBulk(bills: Bill[]): Promise<void>; //uso para seeding do banco de dados
    findOpenBillByGtinCode(gtin_code: string): Promise<Bill>;
    findBillById(bill_id: string): Promise<Bill>;
    billWithThisGtinCodeExists(gtin_code: string): Promise<boolean>;
    updateSavedBill(bill: Bill): Promise<void>
    listSavedBills(): Promise<Bill[]>;
}
