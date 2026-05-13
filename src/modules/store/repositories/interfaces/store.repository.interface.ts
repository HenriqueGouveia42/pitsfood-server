import { Store } from "../../entities/store.js"
import { SubscriptionPlan, SubscriptionStatus } from "../../entities/store.js";
import { PhysicalBill } from "../../../bill/entities/physicalBIllCard.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";


export interface IStoreRepository{
    saveStore(store: Store): Promise<Store | null>;
    findSavedStoreById(store_id: string): Promise<Store | null>;
    updateSavedStore(store: Store): Promise<void>;
    listAllSavedStores(user_id: string): Promise<Store[]>;
    storeWithThisNameExists(name: string): Promise<boolean>;


    saveActivationTransaction(
        activatedStore: Store, 
        paidInvoice: SubscriptionInvoice, 
        physicalBIllCards: Set<PhysicalBill>
    ): Promise<void>;

    findActiveAndExpiredStores(currentDate: Date): Promise<Store[]>;
    updateManyStores(stores: Store[]): Promise<void>;
    findActiveStores(): Promise<Store[]>;

    findStoresExpiringOn(targetDate: Date): Promise<Store[]> 
}