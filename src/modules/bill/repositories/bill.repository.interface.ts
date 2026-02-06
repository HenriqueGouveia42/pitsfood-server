import type { Bill } from "../entities/bill.js";
import { PhysicalBill } from "../entities/physicalBIllCard.js";

export interface IBillRepository {
    createOpenBill(bill: Bill, store_id: string): Promise<void>; //uso para seeding do banco de dados
    createBillBulk(bills: Bill[]): Promise<void>; //uso para seeding do banco de dados
    findOpenBillByGtinCode(gtin_code: string, store_id: string): Promise<Bill | null>;
    findBillById(bill_id: string): Promise<Bill>;
    findAllOpenBills(): Promise<Bill[]>;
    billWithThisGtinCodeExists(gtin_code: string, store_id: string): Promise<boolean>;
    updateSavedBill(bill: Bill): Promise<void>
    listSavedBills(): Promise<Bill[]>;
    findManyOpenBillsByGtinCodes(bill_code_gtins: string[]): Promise<Bill[]>;
    closeManyBillsByGtinsCodes(bill_code_gtins: string[]): Promise<Bill[]>;
}
