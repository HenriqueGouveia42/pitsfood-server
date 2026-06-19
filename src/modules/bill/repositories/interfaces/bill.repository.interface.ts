import type { Bill as EntityBill } from "../../entities/bill.js";

export interface IBillRepository {
    getOpenBillByCode(code: string, store_id: string): Promise<EntityBill | null>;

    getManyOpenBillsByCodes(codes: string[], store_id: string): Promise<EntityBill[]>;

    findAllOpenBills(store_id: string): Promise<EntityBill[]>;
    upsertBill(bill: EntityBill): Promise<void>;
    closeBills(store_id: string, bill_codes: string[]): Promise<void>;
    physicalBillWithThisGtinCodeExists(gtin_code: string, store_id: string): Promise<boolean>;
}
