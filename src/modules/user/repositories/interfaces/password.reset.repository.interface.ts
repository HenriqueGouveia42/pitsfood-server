import { PasswordResetToken } from "../../entities/passwordResetToken.js";

export interface IPasswordResetRepository {
    savePasswordResetToken(password_reset_token: PasswordResetToken): Promise<void>
    findPasswordResetTokenById(password_reset_token_id: string): Promise<PasswordResetToken | null>
    findPasswordResetTokenByUserId(user_id: string): Promise<PasswordResetToken | null>;
    deletePasswordResetToken(password_reset_token_id: string): Promise<void>;

    deleteOldPasswordResetTokenAndSaveTheNewOne(old_password_reset_token_id: string): Promise<void>
}