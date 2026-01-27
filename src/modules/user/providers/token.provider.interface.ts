import { UserRole } from "../../../generated/prisma/enums.js";

export interface ITokenProvider {
    generateToken(
        userId: string,
        role: UserRole,
        storeId: string | null,
        mustChangePassword: boolean,
        token_version: number
    
    ): string;
}