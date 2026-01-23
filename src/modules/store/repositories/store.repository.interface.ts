import { Store } from "../entities/store.js";

export interface IStoreRepository{
    saveStore(store: Store): Promise<Store>;
    findSavedStoreById(store_id: string): Promise<Store>;
    updateSavedStore(store: Store): Promise<void>;
    listAllSavedStores(): Promise<Store[]>;
}