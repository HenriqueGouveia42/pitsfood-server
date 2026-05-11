import type { UserProps, UserRole } from "../../../entities/user.js";
import { User } from "../../../entities/user.js";
import { PasswordResetToken } from "../../../entities/passwordResetToken.js";
import type { User as PrismaUser } from "../../../../../generated/prisma/client.js";
import type { IUserRepository } from "../../interfaces/user.repository.interface.js";

import { prisma } from "../../../../../shared/infra/prisma.js"
import { Prisma } from "../../../../../generated/prisma/client.js";
import type { UserUncheckedCreateInput } from "../../../../../generated/prisma/models.js";

type PrismaUsersWithDevices = Prisma.UserGetPayload<{
    include: { authorized_devices: true }
}>

export class PrismaUserRepository implements IUserRepository {

    private static prismaToEntityDataMapper(prismaUser: PrismaUsersWithDevices): User {

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
            paying_user: prismaUser.paying_user,
            cpf_cnpj: prismaUser.cpf_cnpj,
            phone: prismaUser.phone,

            authorized_devices: prismaUser.authorized_devices.map(device => ({
                device_id: device.device_id,
                name: device.name,
                added_at: device.added_at
            }))
        }

        return User.restore(userProps);
    }

    private static entityToPrismaDataMapper(user: User): Prisma.UserUncheckedCreateInput {
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
            paying_user: user.paying_user,
            cpf_cnpj: user.cpf_cnpj,
            phone: user.phone,

            authorized_devices: {
                create: user.authorized_devices.map(device => ({
                    device_id: device.device_id,
                    name: device.name,
                    added_at: device.added_at
                }))
            }
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
            },
            include: {
                authorized_devices: true
            }
        })

        if(!prismaUser){
            return null;
        }

        return PrismaUserRepository.prismaToEntityDataMapper(prismaUser);

    }

    async updateSavedUser(user: User): Promise<void> {

        const prismaData = PrismaUserRepository.entityToPrismaDataMapper(user);

        const { user_id, store_id, created_at, authorized_devices, ...dataToUpdate } = prismaData;

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

        let prismaUsers: PrismaUsersWithDevices[];

        if(active != undefined ){

            prismaUsers = await prisma.user.findMany({
                where:{
                    active,
                    store_id
                },
                include: {
                    authorized_devices: true
                }
            });

        } else{

            prismaUsers = await prisma.user.findMany({
                where:{
                    store_id
                },
                include: {
                    authorized_devices: true
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
            },
            include: {
                authorized_devices: true
            }
        })

        if(!prismaUserData){
            return null;
        }
        
        return PrismaUserRepository.prismaToEntityDataMapper(prismaUserData);
    
    }

    async findUserByCPFCNPJ(cpf_cnpj: string): Promise<User | null> {
        
        const user: PrismaUsersWithDevices | null = await prisma.user.findFirst({
            where:{
                cpf_cnpj: cpf_cnpj
            },
            include: {
                authorized_devices: true
            }
        })

        if (user) return PrismaUserRepository.prismaToEntityDataMapper(user);

        return null

    }

    async updateForgottenPasswordAndConsumeToken(updated_password_user: User, password_reset_token: PasswordResetToken){
        
        await prisma.$transaction(async (tx) =>{

            const prismaUserData: UserUncheckedCreateInput = PrismaUserRepository.entityToPrismaDataMapper(updated_password_user);

            const { user_id, store_id, created_at, authorized_devices, ...dataToUpdate } = prismaUserData;

            await tx.user.update({
                where:{
                    user_id: updated_password_user.id
                },
                data:{
                    ...dataToUpdate,
                    updated_at: new Date()
                }
            })

            await tx.passwordResetToken.delete({
                where: {id: password_reset_token.id}
            })

        })

    }

    async addAuthorizedDevice(user_id: string, device_id: string, device_name: string): Promise<void> {
        
        await prisma.authorizedDevice.create({
            data:{
                user_id: user_id,
                device_id: device_id,
                name: device_name
            }
        })

    }


}