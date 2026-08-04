import type { Bill as EntityBill } from "../../entities/bill.js";

export interface IBillRepository {
    getOpenBillByCode(code: string, store_id: string): Promise<EntityBill | null>;

    getManyOpenBillsByCodes(codes: string[], store_id: string): Promise<EntityBill[]>;

    findAllOpenBills(store_id: string): Promise<EntityBill[]>;
    upsertBill(bill: EntityBill): Promise<void>;
    closeBills(store_id: string, bill_codes: string[], now: Date): Promise<void>;
    physicalBillWithThisGtinCodeExists(gtin_code: string, store_id: string): Promise<boolean>;
    findBillByBillId(bill_id: string): Promise<EntityBill | null>;
    deactivateItem(store_id: string, bill_id: string, bill_item_id: string, user_id: string, now: Date): Promise<void>;
    reactivateItem(store_id: string, bill_id: string, bill_item_id: string, now: Date): Promise<void>
}
