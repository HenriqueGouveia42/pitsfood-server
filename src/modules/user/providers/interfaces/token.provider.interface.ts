import { UserRole } from "../../entities/user.js";

export interface ITokenProvider {
    generateToken(
        userId: string,
        role: UserRole,
        storeId: string | null,
        mustChangePassword: boolean,
        token_version: number,
        is_paying_user: boolean
    
    ): string;

    generatePreAuthToken(
        userId: string
    ): string;

    verifyToken<T>(token: string): T;
}