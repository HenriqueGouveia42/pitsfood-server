import type { IStoreRepository } from "../../interfaces/store.repository.interface.js";
import { Store, SubscriptionPlan, SubscriptionStatus } from "../../../entities/store.js";
import { AppError } from "../../../../../shared/errors/AppError.js";
import type { SubscriptionPlanAndStatus } from "../../../entities/store.js";

export class InMemoryStoreRepository implements IStoreRepository {

    // ÚNICO estado permitido aqui: Lojas.
    public stores: Store[] = [];

    async saveStore(store: Store): Promise<Store | null> {
        this.stores.push(store);
        return store;
    }

    async findSavedStoreById(store_id: string): Promise<Store | null> {
        const store: Store | undefined = this.stores.find(item => item.id === store_id);
        return store ? store : null;
    }

    async updateSavedStore(store: Store): Promise<void> {
        const index: number = this.stores.findIndex(item => item.id === store.id);
        if(index !== -1){
            this.stores[index] = store;
        }
    }

    async listAllSavedStores(user_id: string): Promise<Store[]> {
        return this.stores.filter(item => item.ownerId === user_id);
    }

    async storeWithThisNameExists(name: string): Promise<boolean> {
        return this.stores.some(item => item.name === name);
    }

    // Nota: Este método não estava no snippet da interface que você enviou antes, 
    // mas mantive caso você o tenha adicionado recentemente.
    async getSubscriptionPlanAndStatus(store_id: string): Promise<SubscriptionPlanAndStatus> {
        const store: Store | undefined = this.stores.find(item => item.id === store_id);

        if (!store){
            throw new AppError("Loja nao encontrada", 404);
        }
        
        return {
            plan: store.plan as SubscriptionPlan,
            plan_status: store.subscription_status as SubscriptionStatus
        };
    }

    async findActiveAndExpiredStores(currentDate: Date): Promise<Store[]> {
        return this.stores.filter(item => {
            const isStoreActive: boolean = item.active === true;
            const isStatusActive: boolean = item.subscription_status === SubscriptionStatus.ACTIVE;
            
            const isExpired: boolean = item.subscription_expires_at 
                ? new Date(item.subscription_expires_at) <= currentDate 
                : false; 

            return isStoreActive && isStatusActive && isExpired;
        });
    }

    async updateManyStores(stores: Store[]): Promise<void> {
        if (stores.length === 0) return;

        this.stores = this.stores.map(existingStore => {
            const updatedStore: Store | undefined = stores.find(item => item.id === existingStore.id);
            return updatedStore ? updatedStore : existingStore;
        });
    }

    async findActiveStores(): Promise<Store[]> {
        return this.stores.filter(item => item.active === true);
    }

    // ADICIONADO: Faltava na sua implementação do mock para cumprir o contrato da interface.
    async findStoresExpiringOn(targetDate: Date): Promise<Store[]> {
        return this.stores.filter(item => {
            if (!item.subscription_expires_at) return false;
            
            const expDate = new Date(item.subscription_expires_at);
            // Ignora horas/minutos/segundos para comparar apenas o dia
            return expDate.toISOString().split('T')[0] === targetDate.toISOString().split('T')[0];
        });
    }
}