import type { IPasswordResetRepository } from "../../interfaces/password.reset.repository.interface.js";

import type { PasswordResetToken as PrismaPasswordResetToken } from "../../../../../generated/prisma/client.js";
import { PasswordResetToken as EntityPasswordResetToken, PasswordResetToken  } from "../../../entities/passwordResetToken.js";
import type { PasswordResetTokenProps } from "../../../entities/passwordResetToken.js";

import { prisma } from "../../../../../shared/infra/prisma.js";

export class PrismaResetPassword implements IPasswordResetRepository {

    private static prismaToEntityDataMapper(prismaData: PrismaPasswordResetToken): EntityPasswordResetToken{

        const props: PasswordResetTokenProps = {
            id: prismaData.id,
            user_id: prismaData.user_id,
            token: prismaData.token,
            created_at: prismaData.created_at.toISOString(),
            expires_at: prismaData.expires_at.toISOString(),
            failed_attempts: prismaData.failed_attempts
        }

        return EntityPasswordResetToken.restore(props);

    }

    private static entityToPrismaDataMapper(entityData: EntityPasswordResetToken): PrismaPasswordResetToken{
        
        const prismaData: PrismaPasswordResetToken = {
            id: entityData.id,
            user_id: entityData.user_id,
            token: entityData.token,
            created_at: new Date(entityData.created_at),
            expires_at: new Date(entityData.expires_at),
            failed_attempts: entityData.failed_attempts
        }

        return prismaData
    }

    async savePasswordResetToken(password_reset_token: PasswordResetToken): Promise<void> {
        
        const prismaData: PrismaPasswordResetToken = PrismaResetPassword.entityToPrismaDataMapper(password_reset_token);

        

        await prisma.passwordResetToken.upsert({
            where:{
                user_id: password_reset_token.user_id
            },
            update: prismaData,
            create: prismaData
        })

    }

    async findPasswordResetTokenById(password_reset_token_id: string): Promise<PasswordResetToken | null> {

        const prismaData: PrismaPasswordResetToken | null= await prisma.passwordResetToken.findUnique({
            where:{
                id: password_reset_token_id
            }
        })

        if (!prismaData) return null;

        return PrismaResetPassword.prismaToEntityDataMapper(prismaData);
        
    }

    async findPasswordResetTokenByUserId(user_id: string): Promise<PasswordResetToken | null> {
        const prismaData = await prisma.passwordResetToken.findFirst({
            where: { user_id: user_id }
        });

        if (!prismaData) return null;
        return PrismaResetPassword.prismaToEntityDataMapper(prismaData);
    }

    async deletePasswordResetToken(password_reset_token_id: string): Promise<void> {
        await prisma.passwordResetToken.delete({
            where: { id: password_reset_token_id }
        });
    }

}