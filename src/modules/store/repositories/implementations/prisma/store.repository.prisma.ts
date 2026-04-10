import type { StoreProps } from "../../../entities/store.js";
import { Store } from "../../../entities/store.js";
import type { IStoreRepository } from "../../interfaces/store.repository.interface.js";

import { PhysicalBill as EntityPhysicalBill } from "../../../../bill/entities/physicalBIllCard.js";
import type { PhysicalBillCard as PrismaPhysicalBill } from "../../../../../generated/prisma/client.js";

import { InvoiceStatus as PrismaInvoiceStatus } from "../../../../../generated/prisma/client.js";
import { SubscriptionInvoice } from "../../../entities/subscriptionInvoice.js";

import { prisma } from "../../../../../shared/infra/prisma.js";
import { AppError } from "../../../../../shared/errors/AppError.js";

import type { Store as PrismaStoreModel } from "../../../../../generated/prisma/client.js";
import type { User } from "../../../../user/entities/user.js";
import { UserRole } from "../../../../../generated/prisma/client.js";

import { SubscriptionPlan as PrismaPlan } from "../../../../../generated/prisma/client.js";
import { SubscriptionStatus as PrismaSubscriptionStatus } from "../../../../../generated/prisma/client.js";

import { SubscriptionPlan  as EntityPlan} from "../../../entities/store.js";
import { SubscriptionStatus as EntitySubscriptionStatus } from "../../../entities/store.js";

import type { SubscriptionPlanAndStatus } from "./../../interfaces/store.repository.interface.js"

import { SubscriptionStatus } from "../../../entities/store.js";

import { PLAN_LIMITS } from "../../../../../config/plans.config.js";

export class PrismaStoreRepository implements IStoreRepository {

    private static prismaToEntityDataMapper(prismaStore: PrismaStoreModel): Store {

        // Proteção: Se o banco retornar null no owner_id, algo está muito errado com os dados
        if (!prismaStore.owner_id) {
            throw new AppError("Erro de integridade: Loja encontrada sem proprietário vinculado.", 500, "DATA_INTEGRITY_ERROR");
        }

        return Store.restore({
            store_id: prismaStore.store_id,
            name: prismaStore.name,
            cnpj: prismaStore.cnpj ? prismaStore.cnpj : null,
            owner_id: prismaStore.owner_id,
            active: prismaStore.active,
            created_at: prismaStore.created_at.toISOString(),
            updated_at: prismaStore.updated_at.toISOString(),
            plan: prismaStore.plan as EntityPlan,
            subscription_status: prismaStore.subscription_status as EntitySubscriptionStatus,
            store_icon_url: prismaStore.store_icon_url,
            subscription_expires_at: prismaStore.subscription_expires_at ? prismaStore.subscription_expires_at.toISOString() : null,
            billing_day: prismaStore.billing_day ? prismaStore.billing_day : null
        })
    }

    private static entityToPrismaDataMapper(store: Store) {

        const props: StoreProps = store.getProps;

        return {
                store_id: props.store_id,
                name: props.name,
                cnpj: props.cnpj ?? null,
                owner_id: props.owner_id,
                active: props.active,
                created_at: new Date(props.created_at),
                updated_at: new Date(),
                plan: props.plan,
                subscription_status: props.subscription_status,
                store_icon_url: props.store_icon_url,
                subscription_expires_at: props.subscription_expires_at ? new Date(props.subscription_expires_at) : null,
                billing_day: props.billing_day ? props.billing_day : null
            }
        }

    private static entityToPrismaPhysicalBillDataMapper(entity_physical_bill: EntityPhysicalBill): PrismaPhysicalBill{
        return {
            store_id: entity_physical_bill.store_id,
            created_at: new Date(entity_physical_bill.createdAt),
            updated_at: new Date(entity_physical_bill.updatedAt),
            id: entity_physical_bill.id,
            code: entity_physical_bill.code,
            is_lost: entity_physical_bill.is_lost
        }
    }

    private static mapEntityPlanToPrismaPlan(plan: EntityPlan): PrismaPlan {
        
        const planMap: Record<EntityPlan, PrismaPlan> = {
            [EntityPlan.NONE]: PrismaPlan.NONE,
            [EntityPlan.BASIC]: PrismaPlan.BASIC,
            [EntityPlan.EXTENDED]: PrismaPlan.EXTENDED,
            [EntityPlan.PREMIUM]: PrismaPlan.PREMIUM,
            [EntityPlan.PERSONALIZED]: PrismaPlan.PERSONALIZED
        };

        const prismaPlan = planMap[plan];

        if (!prismaPlan) throw new AppError(`Erro de mapeamento: O plano '${plan}' não existe no banco de dados.`, 500, "PLAN_MAPPING_ERROR");
        
        return prismaPlan;
    }

    async saveStore(store: Store): Promise<Store | null> {

        const storePrismaData = PrismaStoreRepository.entityToPrismaDataMapper(store);

        const resultPrismaStore = await prisma.$transaction(async (tx) =>{

            const createdStore = await tx.store.create({
                data: storePrismaData
            }) //persiste aloja

            if (storePrismaData.owner_id){
                await tx.user.update({
                    where:{
                        user_id: store.ownerId
                    },
                    data:{
                        store_id: store.id,
                        role: UserRole.GESTOR
                    }
                })
            }//atualiza o usuario
            return createdStore
        })

        if (resultPrismaStore === null){
            return null
        }

        const entityStore: Store = PrismaStoreRepository.prismaToEntityDataMapper(resultPrismaStore);

        return entityStore;

    }

    async findSavedStoreById(store_id: string): Promise<Store | null> {

        const storePrismaData = await prisma.store.findUnique({
            where: {
                store_id
            }
        })

        if (!storePrismaData) {
            throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND")
        }

        return PrismaStoreRepository.prismaToEntityDataMapper(storePrismaData);
    }

    async updateSavedStore(store: Store): Promise<void> {
        
        const storePrismaData = PrismaStoreRepository.entityToPrismaDataMapper(store);

        const { created_at, ...dataToUpdate } = storePrismaData;

        await prisma.store.update({
            where: {
                store_id: storePrismaData.store_id
            },
            data: dataToUpdate
        })
    }

    async listAllSavedStores(user_id: string): Promise<Store[]> {
        const storesPrismaData = await prisma.store.findMany({
            where:{
                owner_id: user_id
            }
        });

        const stores = storesPrismaData.map((s) => 
            PrismaStoreRepository.prismaToEntityDataMapper(s)
        )

        return stores;
    }

    async storeWithThisNameExists(name: string): Promise<boolean>{

        const prismaStore = await prisma.store.findFirst({
            where:{
                name
            }
        })

        if(!prismaStore) return false

        return true
    }

    async saveActivationTransaction(
        store: Store, 
        paid_invoice: SubscriptionInvoice,
        physicalBIllCards: Set<EntityPhysicalBill>

    ): Promise<void> {

        const storePrismaData = PrismaStoreRepository.entityToPrismaDataMapper(store);

        const { store_id, created_at, ...storeUpdateData } = storePrismaData;

        const prismaPhysicalBills = Array.from(physicalBIllCards, (b) => 
            PrismaStoreRepository.entityToPrismaPhysicalBillDataMapper(b));
        
        await prisma.$transaction(async (tx) => {

            //atualiza a loja
            await tx.store.update({
                where: { store_id: store.id },
                data: storeUpdateData
            });

            //atualiza a fatura
            await tx.subscriptionInvoice.update({
                where: { invoice_id: paid_invoice.id },
                data:{
                    status: paid_invoice.status as unknown as PrismaInvoiceStatus,
                    paid_at: paid_invoice.paidAt ? new Date(paid_invoice.paidAt) : new Date()
                }
            });

            //cria as novas comandas em lote
            if (prismaPhysicalBills.length > 0){
                await tx.physicalBillCard.createMany({
                    data: prismaPhysicalBills
                })
            }

        })

       
    }

    async getSubscriptionPlanAndStatus(store_id: string): Promise<SubscriptionPlanAndStatus>{

        const prismaStore: PrismaStoreModel = await prisma.store.findFirstOrThrow({
            where:{
                store_id: store_id
            }
        });

        const entityStore: Store = PrismaStoreRepository.prismaToEntityDataMapper(prismaStore);

        const entityPlan: EntityPlan = entityStore.plan;
        const entityPlanStatus: EntitySubscriptionStatus = entityStore.subscription_status;

        return{
            plan: entityPlan,
            plan_status: entityPlanStatus
        }
        
    }

    async findActiveAndExpiredStores(currentDate: Date): Promise<Store[]> {

        const prismaStores: PrismaStoreModel[] = await prisma.store.findMany({
            where: {
                active: true, //A loja não foi "apagada" ou banida do sistema
                subscription_status: SubscriptionStatus.ACTIVE, //O banco ainda acha que ela está em dia
                subscription_expires_at: {
                    lte: currentDate //A data de expiração é menor ou igual a agora
                }
            }
        });

        if (prismaStores.length === 0) return [];

        const entityStores: Store[] = prismaStores.map(s => 
            PrismaStoreRepository.prismaToEntityDataMapper(s)
        );

        return entityStores;
    }

    async updateManyStores(stores: Store[]): Promise<void> {
        
        if (stores.length === 0) return;

        // Cria um array de promessas de atualização
        const updatePromises = stores.map((store) => {
            const storePrismaData = PrismaStoreRepository.entityToPrismaDataMapper(store);
            const { created_at, ...dataToUpdate } = storePrismaData;

            return prisma.store.update({
                where: { store_id: storePrismaData.store_id },
                data: dataToUpdate
            });
        });

        // Executa todas as atualizações dentro de uma única transação atômica
        await prisma.$transaction(updatePromises);
    }

    async findActiveStores(): Promise<Store[]> {
        
        const prismaStores = await prisma.store.findMany({
            where:{
                active: true
            }
        })

        if (prismaStores.length === 0) return [];

        const entityStores: Store[] = prismaStores.map(s => PrismaStoreRepository.prismaToEntityDataMapper(s));

        return entityStores;
    }

}
