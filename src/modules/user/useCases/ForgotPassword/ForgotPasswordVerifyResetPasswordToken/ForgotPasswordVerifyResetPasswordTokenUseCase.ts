import type { IUserRepository } from "../../../repositories/interfaces/user.repository.interface.js"
import type { IHashedStringProvider } from "../../../../../shared/providers/HashedStringProvider/models/IHashedStringProvider.js";
import { User } from "../../../entities/user.js"
import { PasswordResetToken } from "../../../entities/passwordResetToken.js";
import { AppError } from "../../../../../shared/errors/AppError.js";
import type { IPasswordResetRepository } from "../../../repositories/interfaces/password.reset.repository.interface.js";
import { MAX_FAILED_ATTEMPTS } from "../../../entities/passwordResetToken.js";
import { UserRole } from "../../../entities/user.js";
import type { UpdateForgottenPasswordAndConsumeTokenService } from "../../../services/uow/UpdateForgottenPasswordAndConsumeTokenService.js";

export type InputDTO = {
    email: string,
    reset_token: string,
    new_password: string
}

const GENERIC_ERROR_MESSAGE: string = "Dados inválidos. Verifique as informações fornecidas ou solicite um novo código."


export class ForgotPasswordVerifyResetPasswordTokenUseCase{
    constructor(
        private userRepository: IUserRepository,
        private passwordResetRepository: IPasswordResetRepository,
        private hashedStringProvider: IHashedStringProvider,
        private updateForgottenPasswordAndConsumeTokenService: UpdateForgottenPasswordAndConsumeTokenService
        
    ){}

    async execute(input: InputDTO): Promise<void>{


        const user: User | null = await this.userRepository.findUserByEmail(input.email);
        if (!user) throw new AppError(GENERIC_ERROR_MESSAGE, 400, "INVALID_REQUEST");

        if (user.role != UserRole.GESTOR) throw new AppError("Peça para um GESTOR atualizar a sua senha", 403, "FORBIDDEN");

        const password_reset_token: PasswordResetToken | null = await this.passwordResetRepository.findPasswordResetTokenByUserId(user.id);
        if (!password_reset_token) throw new AppError(GENERIC_ERROR_MESSAGE, 400, "TOKEN_INVALID");

        const now: Date = new Date();

        if(now.getTime() > new Date(password_reset_token.expires_at).getTime()){
            await this.passwordResetRepository.deletePasswordResetToken(password_reset_token.id);
            throw new AppError(GENERIC_ERROR_MESSAGE, 404, "TOKEN_INVALID");
        } 

        if (input.reset_token != password_reset_token.token){

            const failled_attempt_password_reset_token: PasswordResetToken = password_reset_token.addFailedAttempt();

            if (failled_attempt_password_reset_token.isExhausted()){
                await this.passwordResetRepository.deletePasswordResetToken(failled_attempt_password_reset_token.id);
                throw new AppError("Limite máximo de tentativas atingido", 429, "MAX_ATTEMPTS_REACHED");
            }

            await this.passwordResetRepository.savePasswordResetToken(failled_attempt_password_reset_token);
            throw new AppError(`Token de reset incorreto. Restam ${MAX_FAILED_ATTEMPTS-failled_attempt_password_reset_token.failed_attempts} tentativas`, 400, "TOKEN_INCORRECT");
        }

        const hashed_password: string = await this.hashedStringProvider.hashString(input.new_password);
        const user_updated_password: User = user.setNewPassword(hashed_password);
        
        //await this.userRepository.updateForgottenPasswordAndConsumeToken(user_updated_password, password_reset_token);

        await this.updateForgottenPasswordAndConsumeTokenService.execute({
            updated_password_user: user_updated_password,
            password_reset_token: password_reset_token
        })

    }

}