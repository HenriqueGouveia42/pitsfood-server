import type { StoreProps } from "../../../entities/store.js";
import { Store } from "../../../entities/store.js";
import type { IStoreRepository } from "../../store.repository.interface.js"

import { prisma } from "../../../../../shared/infra/prisma.js";
import { AppError } from "../../../../../shared/errors/AppError.js";

import type { Store as PrismaStoreModel } from "../../../../../generated/prisma/client.js";
import type { User } from "../../../../user/entities/user.js";

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
            updated_at: prismaStore.updated_at.toISOString() 
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
            updated_at: new Date()
        }
    }

    async saveStore(store: Store): Promise<Store | null> {

        //ao salvarmos uma loja no banco de dados, devemos imediatamente atualizar o campo "store_id" da tabela "user"
        //o objeto "store" ja vai vir com o "owner_id"

        const storePrismaData = PrismaStoreRepository.entityToPrismaDataMapper(store);


        const resultPrismaStore = await prisma.$transaction(async (tx) =>{

            const createdStore = await tx.store.create({
                data: storePrismaData
            })

            if (storePrismaData.owner_id){
                await tx.user.update({
                    where:{
                        user_id: store.ownerId
                    },
                    data:{
                        store_id: store.id
                    }
                })
            }

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

    async listAllSavedStores(): Promise<Store[]> {
        const storesPrismaData = await prisma.store.findMany();

        const stores = storesPrismaData.map((s) => 
            PrismaStoreRepository.prismaToEntityDataMapper(s)
        )

        return stores;
    }
}