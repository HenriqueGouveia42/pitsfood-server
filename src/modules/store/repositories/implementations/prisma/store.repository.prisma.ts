import type { StoreProps } from "../../../entities/store.js";
import { Store } from "../../../entities/store.js";
import type { IStoreRepository } from "../../store.repository.interface.js"

import { prisma } from "../../../../../shared/infra/prisma.js";
import { AppError } from "../../../../../shared/errors/AppError.js";

import type { Store as PrismaStoreModel } from "../../../../../generated/prisma/client.js";

export class PrismaStoreRepository implements IStoreRepository {

    private static prismaToEntityDataMapper(prismaStore: PrismaStoreModel): Store {
        return Store.restore({
            store_id: prismaStore.store_id,
            name: prismaStore.name,
            cnpj: prismaStore.cnpj ?? undefined,
            active: prismaStore.active,
            created_at: prismaStore.created_at.toISOString(),
            updated_at: prismaStore.updated_at.toISOString() 
        })
    }

    private static entityToPrismaDataMapper(store: Store) {
        const props: StoreProps = store.getProps;

        return {
            store_id: props.store_id,
            name: props.name,
            cnpj: props.cnpj ?? null,
            active: props.active,
            created_at: new Date(props.created_at),
            updated_at: new Date()
        }
    }

    async saveStore(store: Store): Promise<void> {

        const storePrismaData = PrismaStoreRepository.entityToPrismaDataMapper(store);

        await prisma.store.create({
            data: storePrismaData
        })
    }

    async findSavedStoreById(store_id: string): Promise<Store> {

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

    async listAllSavedStores(): Promise<Store[]> {
        const storesPrismaData = await prisma.store.findMany();

        const stores = storesPrismaData.map((s) => 
            PrismaStoreRepository.prismaToEntityDataMapper(s)
        )

        return stores;
    }
}