import type { IStagedUserRepository } from "../staged_user.repository.interface.js"
import { StagedUser } from "../../entities/stagedUser.js"
import type { StagedUserProps } from "../../entities/stagedUser.js"
import { User } from "../../../user/entities/user.js"

import { prisma } from "../../../../shared/infra/prisma.js"

export class PrismaStagedUserRepository implements IStagedUserRepository{

    private static prismaToEntityDataMapper(prismaStagedUser: any): StagedUser{

        const staged_user_props: StagedUserProps = {
            id: prismaStagedUser.id,
            email: prismaStagedUser.email,
            username: prismaStagedUser.username,
            password_hash: prismaStagedUser.password_hash, 
            verification_code: prismaStagedUser.verification_code,
            expires_at: prismaStagedUser.expires_at,
            created_at: prismaStagedUser.created_at
        }

        return StagedUser.restore(staged_user_props);
    }

    private static entityToPrismaDataMapper(staged_user: StagedUser): any{
        
        return {
            id: staged_user.id,
            email: staged_user.email,
            username: staged_user.username,
            verification_code: staged_user.verificationCode,
            expires_at: staged_user.expiresAt,
            created_at: staged_user.createdAt,
            password_hash: staged_user.password_hash
        }
    }

    async saveStagedUser(stagedUser: StagedUser): Promise<void>{

        const prismaData = PrismaStagedUserRepository.entityToPrismaDataMapper(stagedUser);

        await prisma.stagedUser.create({
            data: prismaData
        })

    }

    async findStagedUserById(staged_user_id: string): Promise <StagedUser>{

        const prismaData = await prisma.stagedUser.findFirst({
            where:{
                id: staged_user_id
            }
        })

        const entityData: StagedUser = PrismaStagedUserRepository.prismaToEntityDataMapper(prismaData);

        return entityData
    }

    async deleteStagedUserById(staged_user_id: string): Promise <void>{

        await prisma.stagedUser.delete({
            where:{
                id: staged_user_id
            }
        })

    }

    async findStagedUserByEmail(email: string): Promise<StagedUser | null> {
        
        const prismaData = await prisma.stagedUser.findFirst({
            where:{
                email
            }
        })

        if(!prismaData){
            return null;
        }

        const entityData: StagedUser = PrismaStagedUserRepository.prismaToEntityDataMapper(prismaData);

        return entityData;
    }

    async deleteStagedUserAndCreateUser(staged_user: StagedUser, user: User): Promise<void>{
        /*
            model User {
                email         String   @unique
                user_id       String   @id
                username      String   //@unique - username nao pode ser unique, pois se for unique, o mesmo username nao poderá se repetir em todo o banco de dados, o que é ruim, basta que o username nao se repita somente dentro da mesma loja
                password_hash String
                role          UserRole
                created_at    DateTime @default(now())
                updated_at    DateTime @updatedAt
                active        Boolean @default(true)
                
                store_id  String?
                store Store? @relation("StoreUsers", fields: [store_id], references: [store_id])
                owned_store Store? @relation("StoreOwner")

                //relacionamentos
                sales_closed  Sale[]        @relation("UserClosedSale")
                items_added   BillProduct[] @relation("UserAddedItem")

                @@unique([username, store_id]) //um username deve ser unico APENAS dentro daquela loja
                @@unique([user_id, store_id]) //indice composto que sera utilizado por BillProduct e Sale
                @@map("users")
            }
        */

        const newUserData = {

            email:user.email,
            user_id: user.id,
            username: user.username,
            password_hash: user.passwordHash,
            role: user.role,
            created_at: user.createdAt,
            updated_at: user.updatedAt,
            active: user.active,
            store_id: user.storeId || null, 
        }
        
        await prisma.$transaction(async (tx) =>{

            await tx.stagedUser.delete({
                where:{
                    id: staged_user.id
                }
            })

            await await tx.user.create({
                data: newUserData
            })
        })

    }
    
}