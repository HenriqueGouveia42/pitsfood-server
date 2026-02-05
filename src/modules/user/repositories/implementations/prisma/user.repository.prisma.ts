import type { UserProps, UserRole } from "../../../entities/user.js";
import { User } from "../../../entities/user.js";
import type { IUserRepository } from "../../user.repository.interface.js";

import { prisma } from "../../../../../shared/infra/prisma.js"
import { AppError } from "../../../../../shared/errors/AppError.js";
import type { Store } from "../../../../store/entities/store.js";

export class PrismaUserRepository implements IUserRepository {

    private static prismaToEntityDataMapper(prismaUser: any): User {

        const userProps: UserProps = {
            user_id: prismaUser.user_id,
            store_id: prismaUser.store_id,
            email: prismaUser.email,
            username: prismaUser.username,
            password_hash: prismaUser.password_hash,
            role: prismaUser.role as UserRole,
            created_at: prismaUser.created_at.toISOString(),
            updated_at: prismaUser.updated_at.toISOString(),
            active: prismaUser.active,
            must_change_password: prismaUser.must_change_password,
            paying_user: prismaUser.paying_user
        }

        return User.restore(userProps);
    }

    private static entityToPrismaDataMapper(user: User): any {
        return{
            user_id: user.id,
            store_id: user.storeId,
            username: user.username,
            email: user.email,
            password_hash: user.passwordHash,
            role: user.role,
            created_at: new Date(user.createdAt),
            updated_at: new Date(user.updatedAt),
            active: user.active,
            must_change_password: user.mustChangePassword,
            paying_user: user.paying_user
        }
    }

    async saveUser(user: User): Promise<void> {
        
        const prismaData = PrismaUserRepository.entityToPrismaDataMapper(user);

        await prisma.user.create({
            data: prismaData
        })
    }

    async findSavedUserById(user_id: string): Promise<User | null> {

        const prismaUser = await prisma.user.findUnique({
            where:{
                user_id,
            }
        })

        if(!prismaUser){
            return null;
        }

        return PrismaUserRepository.prismaToEntityDataMapper(prismaUser);

    }

    async updateSavedUser(user: User): Promise<void> {

        const prismaData = PrismaUserRepository.entityToPrismaDataMapper(user);

        const { user_id, store_id, created_at, ...dataToUpdate } = prismaData;

        await prisma.user.update({
            where:{
                user_id: user.id,
            },
            data: {
                ...dataToUpdate,
                updated_at: new Date()
            }
        });
    }

    async listAllSavedUsers(store_id: string, active: boolean | undefined): Promise<User[]> {

        let prismaUsers;
        if(active != undefined ){

            prismaUsers = await prisma.user.findMany({
                where:{
                    active,
                    store_id
                }
            });

        } else{

            prismaUsers = await prisma.user.findMany({
                where:{
                    store_id
                }
            })
        }
        

        if (prismaUsers.length === 0){
            return [];
        }

        return prismaUsers.map(prismaUser =>
            PrismaUserRepository.prismaToEntityDataMapper(prismaUser)
        );       
    }

    async findUserByEmail(email: string): Promise<User | null> {
        
        const prismaUserData = await prisma.user.findFirst({
            where:{
                email
            }
        })

        if(!prismaUserData){
            return null;
        }
        
        return PrismaUserRepository.prismaToEntityDataMapper(prismaUserData);
    
    }

    async logoutUserFromStore(user: User): Promise<void> {

        await prisma.user.update({
            where:{
                user_id: user.id
            },
            data:{
                store_id: null,
                updated_at: new Date()
            }
        })
    }

    async loginUserIntoStore(user: User, store: Store): Promise<void>{
        
        await prisma.user.update({
            where:{
                user_id: user.id
            },
            data:{
                store_id: store.id,
                updated_at: new Date()
            }
        })
    }


}