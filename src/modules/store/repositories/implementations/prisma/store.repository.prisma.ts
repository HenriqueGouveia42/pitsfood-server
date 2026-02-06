import type { StoreProps } from "../../../entities/store.js";
import { Store } from "../../../entities/store.js";
import type { IStoreRepository } from "../../interfaces/store.repository.interface.js";
import { PhysicalBill } from "../../../../bill/entities/physicalBIllCard.js";
import { InvoiceStatus } from "../../../../../generated/prisma/client.js";

import { prisma } from "../../../../../shared/infra/prisma.js";
import { AppError } from "../../../../../shared/errors/AppError.js";

import type { Store as PrismaStoreModel } from "../../../../../generated/prisma/client.js";
import type { User } from "../../../../user/entities/user.js";
import { UserRole } from "../../../../../generated/prisma/client.js";

import { SubscriptionPlan as PrismaPlan } from "../../../../../generated/prisma/client.js";
import { SubscriptionStatus as PrismaSubscriptionStatus } from "../../../../../generated/prisma/client.js";

import { SubscriptionPlan  as EntityPlan} from "../../../entities/store.js";
import { SubscriptionStatus as EntitySubscriptionStatus } from "../../../entities/store.js";


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
            subscription_status: prismaStore.subscription_status as EntitySubscriptionStatus
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
            subscription_status: props.subscription_status
        }
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

    async activateSubscription(
        store_id: string, 
        invoice_id: string, 
        plan: EntityPlan,
        expires_at: Date
    ): Promise<void> {
        
        // Tudo aqui dentro roda como uma unidade indivisível
        await prisma.$transaction([
            // 1. Atualiza a Loja
            prisma.store.update({
                where: { store_id },
                data: {
                    subscription_status: 'ACTIVE', // String literal ou Enum do Prisma
                    plan: plan as any, // Cast se necessário para o enum do Prisma
                    subscription_expires_at: expires_at,
                    updated_at: new Date()
                }
            }),

            // 2. Atualiza a Fatura para PAGA
            prisma.subscriptionInvoice.update({
                where: { invoice_id },
                data: {
                    status: InvoiceStatus.PAID,
                    paid_at: new Date()
                }
            })
        ]);
    }
}
