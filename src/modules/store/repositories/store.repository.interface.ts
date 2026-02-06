import { Store } from "../entities/store.js";

export interface IStoreRepository{
    saveStore(store: Store): Promise<Store | null>;
    findSavedStoreById(store_id: string): Promise<Store | null>;
    updateSavedStore(store: Store): Promise<void>;
    listAllSavedStores(user_id: string): Promise<Store[]>;
    storeWithThisNameExists(name: string): Promise<boolean>
}