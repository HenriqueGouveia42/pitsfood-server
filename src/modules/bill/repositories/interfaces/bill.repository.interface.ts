import type { Bill as EntityBill } from "../../entities/bill.js";

export interface IBillRepository {
    getOpenBillByCode(code: string, store_id: string): Promise<EntityBill | null>;
    findAllOpenBills(store_id: string): Promise<EntityBill[]>;
    upsertBill(bill: EntityBill): Promise<void>;
    closeBills(store_id: string, bill_codes: string[]): Promise<void>;
}
