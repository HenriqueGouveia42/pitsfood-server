import type { IStagedUserRepository } from "../../interfaces/staged_user.repository.interface.js"
import { StagedUser } from "../../../entities/stagedUser.js"
import type { StagedUser as PrismaStagedUser } from "../../../../../generated/prisma/client.js"

import type { StagedUserProps } from "../../../entities/stagedUser.js"
import { User, UserRole } from "../../../../user/entities/user.js"
import type { User as PrismaUser } from "../../../../../generated/prisma/client.js"
import type { UserProps } from "../../../../user/entities/user.js"

import { prisma } from "../../../../../shared/infra/prisma.js"

export class PrismaStagedUserRepository implements IStagedUserRepository{

    private static prismaToStagedUserEntityDataMapper(prismaStagedUser: PrismaStagedUser): StagedUser{

        const staged_user_props: StagedUserProps = {
            id: prismaStagedUser.id,
            email: prismaStagedUser.email,
            username: prismaStagedUser.username,
            password_hash: prismaStagedUser.password_hash, 
            verification_code: prismaStagedUser.verification_code,
            last_verification_code_sent_at: prismaStagedUser.last_verification_code_sent_at.toISOString(),
            created_at: prismaStagedUser.created_at.toISOString(),
            updated_at: prismaStagedUser.updated_at.toISOString(),
            expires_at: prismaStagedUser.expires_at.toISOString(),
            code_expires_at: prismaStagedUser.code_expires_at.toISOString(),
            cpf_cnpj: prismaStagedUser.cpf_cnpj,
            phone: prismaStagedUser.phone
        }

        return StagedUser.restore(staged_user_props);
    }

    private static entityToPrismaDataMapper(staged_user: StagedUser): PrismaStagedUser{

        const last_verification_code_sent_at_date: Date = new Date(staged_user.lastVerificationCodeSentAt);
        const created_at_date: Date = new Date(staged_user.createdAt);
        const updated_at_date: Date = new Date(staged_user.updatedAt);
        const expires_at_date: Date = new Date(staged_user.expiresAt);
        const code_expires_at_date: Date = new Date(staged_user.codeExpiresAt);

        return {
            id: staged_user.id,
            email: staged_user.email,
            username: staged_user.username,
            verification_code: staged_user.verificationCode,
            last_verification_code_sent_at: last_verification_code_sent_at_date,
            created_at: created_at_date,
            updated_at: updated_at_date,
            expires_at: expires_at_date,
            code_expires_at: code_expires_at_date,
            password_hash: staged_user.password_hash,
            cpf_cnpj: staged_user.cpf_cnpj,
            phone: staged_user.phone
        }
    }

    async saveStagedUser(stagedUser: StagedUser): Promise<void>{

        const prismaData: PrismaStagedUser = PrismaStagedUserRepository.entityToPrismaDataMapper(stagedUser);

        await prisma.stagedUser.upsert({
            where: { id: stagedUser.id },
            update: prismaData,
            create: prismaData
        })

    }

    async findStagedUserById(staged_user_id: string): Promise <StagedUser | null>{

        const prismaData = await prisma.stagedUser.findFirst({
            where:{
                id: staged_user_id
            }
        })

        if (!prismaData) return null

        const entityData: StagedUser = PrismaStagedUserRepository.prismaToStagedUserEntityDataMapper(prismaData);

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

        if(!prismaData) return null;
        
        const entityData: StagedUser = PrismaStagedUserRepository.prismaToStagedUserEntityDataMapper(prismaData);

        return entityData;
    }

    async deleteStagedUserAndCreateUser(staged_user: StagedUser, user: User): Promise<void>{
        
        const newUserData: UserProps = {

            email:user.email,
            user_id: user.id,
            username: user.username,
            password_hash: user.passwordHash,
            role: user.role,
            created_at: user.createdAt,
            updated_at: user.updatedAt,
            active: user.active,
            store_id: user.storeId || null,
            must_change_password: user.mustChangePassword, //deve ser false, pois esse é o usuario que se cadastrou pelo email
            paying_user: true, //deve ser true, pois se está sendo criado por esse repo, quer dizer que é um usuario pago
            cpf_cnpj: user.cpf_cnpj,
            phone: user.phone ? user.phone : null
        }
        
        await prisma.$transaction(async (tx) =>{

            await tx.stagedUser.delete({
                where:{ 
                    id: staged_user.id
                }
            })

            await tx.user.create({
                data: newUserData
            })
        })

    }

    
}