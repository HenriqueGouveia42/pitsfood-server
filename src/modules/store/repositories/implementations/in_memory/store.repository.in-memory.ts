import type { IStoreRepository, SubscriptionPlanAndStatus } from "../interfaces/store.repository.interface.js";
import { Store, SubscriptionPlan } from "../../entities/store.js";
import type { PhysicalBill } from "../../../bill/entities/physicalBIllCard.js";
import { SubscriptionStatus } from "../../entities/store.js";

import { PLAN_LIMITS } from "../../../../config/plans.config.js";
import type { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export class InMemoryStoreRepository implements IStoreRepository{

    public stores: Store[] = [];
    public physicalBills: PhysicalBill[] = [];
    public updatedInvoices: SubscriptionInvoice[] = [];

    

    async saveStore(store: Store): Promise<Store | null> {
        this.stores.push(store);
        return store;
    }

    async findSavedStoreById(store_id: string): Promise<Store | null> {
        
        const store: Store | undefined = this.stores.find(item => item.id === store_id);

        return store ? store : null
    }

    async updateSavedStore(store: Store): Promise<void> {

        const index: number = this.stores.findIndex(item => item.id === store.id);
        
        if(index != -1){
            this.stores[index] = store;
        }
    }

    async listAllSavedStores(user_id: string): Promise<Store[]> {

        const stores: Store[] = this.stores.filter(item => item.ownerId === user_id);

        return stores
        
    }

    async storeWithThisNameExists(name: string): Promise<boolean> {

        const exists: boolean = this.stores.some(item => item.name === name);
        return exists;
        
    }

    async saveActivationTransaction(
        activatedStore: Store, 
        paidInvoice: SubscriptionInvoice, 
        physicalBIllCards: Set<PhysicalBill>
    ): Promise<void> {
    
        const storeIndex: number = this.stores.findIndex(item => item.id === activatedStore.id);

        if (!this.stores[storeIndex]) throw new AppError(
            "[Mock DB] Transação abortada: Registro Store não encontrado para atualização.",
            500,
            "RECORD_NOT_FOUND"
        );

        //simplesmente sobrescrevemos a velha instância pela nova instância 
        //que o UseCase nos passou.
        this.stores[storeIndex] = activatedStore;

        //atualiza/Guarda a Fatura Paga no array espião
        const invoiceIndex: number = this.updatedInvoices.findIndex(item => item.id === paidInvoice.id);
        if (invoiceIndex !== -1) {
            this.updatedInvoices[invoiceIndex] = paidInvoice;
        } else {
            //caso a fatura não estivesse no mock ainda, adicionamos
            this.updatedInvoices.push(paidInvoice);
        }

        const billArrays: PhysicalBill[] = Array.from(physicalBIllCards);
        this.physicalBills.push(...billArrays);
        
    }

    async getSubscriptionPlanAndStatus(store_id: string): Promise<SubscriptionPlanAndStatus> {

        const store: Store | undefined = this.stores.find(item => item.id === store_id);

        if (!store){
            throw new Error("Loja nao encontrada");
        }
        
        const store_subscription_plan: SubscriptionPlan = store.plan as SubscriptionPlan
        const store_subscription_status: SubscriptionStatus = store.subscription_status as SubscriptionStatus

        return {
            plan: store_subscription_plan,
            plan_status: store_subscription_status
        }

    }

    async findActiveAndExpiredStores(currentDate: Date): Promise<Store[]> {
        const expiredStores: Store[] = this.stores.filter(item => {
        
        // loja precisa existir (active: true)
        const isStoreActive: boolean = item.active === true;
        
        // 2. status atual AINDA tem que ser ACTIVE (precisamos pegar quem "esqueceu" de pagar)
        const isStatusActive: boolean = item.subscription_status === SubscriptionStatus.ACTIVE;
        
        // data de validade tem que ser menor ou igual à data que o Cron mandou
        // precisamos garantir que a loja tem uma data, e que essa data já passou
        const isExpired: boolean = item.subscription_expires_at 
            ? new Date(item.subscription_expires_at) <= currentDate 
            : false; // Se por algum motivo não tem data, não vamos bloquear aleatoriamente

        return isStoreActive && isStatusActive && isExpired;
    });

    return expiredStores;
}

    async updateManyStores(stores: Store[]): Promise<void> {

        if (stores.length === 0) return;

        this.stores = this.stores.map(existingStore => {
            
            const updatedStore: Store | undefined = stores.find(item => item.id === existingStore.id);

            if (updatedStore){
                return updatedStore
            }

            return existingStore;

        })

        
    }

    async findActiveStores(): Promise<Store[]> {
        return this.stores.filter(item => item.active === true);
    }

}