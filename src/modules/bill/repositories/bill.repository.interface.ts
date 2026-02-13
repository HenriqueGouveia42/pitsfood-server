import type { Bill as EntityBill } from "../entities/bill.js";
import { PhysicalBill } from "../entities/physicalBIllCard.js";

export interface IBillRepository {
    getPhysicalBills(store_id: string): Promise<PhysicalBill[] | null>;
    billWithThisGtinCodeExists(gtin_code: string, store_id: string): Promise<boolean>;
    getOpenBillByGtinCode(gtin_code: string, store_id: string): Promise<EntityBill>

}
