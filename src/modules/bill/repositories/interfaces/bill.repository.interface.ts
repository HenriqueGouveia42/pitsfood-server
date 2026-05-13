import type { Bill as EntityBill } from "../entities/bill.js";
import { PhysicalBill } from "../entities/physicalBIllCard.js";
import { Product } from "../../product/entities/product.js";

export interface IBillRepository {
    getPhysicalBills(store_id: string): Promise<PhysicalBill[] | null>;
    physicalBillWithThisGtinCodeExists(gtin_code: string, store_id: string): Promise<boolean>;
    getOpenBillByGtinCode(gtin_code: string, store_id: string): Promise<EntityBill[]>;
    upsertBill(bill: EntityBill): Promise<void>;
    findAllOpenBills(store_id: string): Promise<EntityBill[]>
}
