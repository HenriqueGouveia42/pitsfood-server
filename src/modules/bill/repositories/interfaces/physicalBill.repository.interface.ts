import { PhysicalBill } from "../../entities/physicalBIllCard.js";

export interface IPhysicalBillRepository {
    saveMany(physicalBills: Set<PhysicalBill>): Promise<void>;
    findByStoreId(store_id: string): Promise<PhysicalBill[]>;
    existsByCode(code: string, store_id: string): Promise<boolean>;
    update(physicalBill: PhysicalBill): Promise<void>; 
}