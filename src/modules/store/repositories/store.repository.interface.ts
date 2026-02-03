import { Store } from "../entities/store.js";
import { PhysicalBill } from "../../bill/entities/physicalBIllCard.js";

export interface IStoreRepository{
    saveStoreAndCreatePhysicalBills(store: Store, physical_bills: PhysicalBill[]): Promise<Store | null>;
    findSavedStoreById(store_id: string): Promise<Store | null>;
    updateSavedStore(store: Store): Promise<void>;
    listAllSavedStores(): Promise<Store[]>;
    
}