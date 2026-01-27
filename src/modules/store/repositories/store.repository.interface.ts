import { Store } from "../entities/store.js";
import { User } from "../../user/entities/user.js";

export interface IStoreRepository{
    saveStore(store: Store): Promise<Store | null>;
    findSavedStoreById(store_id: string): Promise<Store>;
    updateSavedStore(store: Store): Promise<void>;
    listAllSavedStores(): Promise<Store[]>;
    
}