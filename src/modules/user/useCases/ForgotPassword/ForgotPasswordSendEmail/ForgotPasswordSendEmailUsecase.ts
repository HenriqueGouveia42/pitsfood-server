import { randomInt, randomUUID } from "node:crypto";
import type { IMailProvider } from "../../../../../shared/providers/EmailProvider/interface/IMailProvider.js";
import type { IEmailValidationProvider } from "../../../../../shared/providers/EmailValidationProvider/interface/IEmailValidationProvider.js";
import { AppError } from "../../../../../shared/errors/AppError.js";
import type { IPasswordResetRepository } from "../../../repositories/interfaces/password.reset.repository.interface.js";
import type { IUserRepository } from "../../../repositories/interfaces/user.repository.interface.js";

import type { User } from "../../../entities/user.js";
import { PasswordResetToken } from "../../../entities/passwordResetToken.js";

export type InputDTO = {
    email: string;
};

type OutputDTO = {
    email: string;
};

const MINUTES_TO_EXPIRE: number = 10;
const EMAIL_SUBJECT: string = "Recuperação de Senha - Manga Food";
const ONE_MINUTE_COOL_DOWN_MS: number = 60 * 1000
export class ForgotPasswordSendEmailUsecase {
    constructor(
        private mailProvider: IMailProvider,
        private mailValidation: IEmailValidationProvider,
        private passwordResetRepository: IPasswordResetRepository,
        private userRepository: IUserRepository
    ) {}

    private static generateEmailHTML(reset_code: string): string {
        return `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <h2>Recuperação de Senha</h2>
                <p>Você solicitou a redefinição de sua senha na Manga Food. Use o código abaixo para prosseguir com a troca:</p>
                <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; width: fit-content; margin: 20px 0;">
                    <strong style="font-size: 24px; letter-spacing: 3px;">${reset_code}</strong>
                </div>
                <p><small>Este código expira em ${MINUTES_TO_EXPIRE} minutos.</small></p>
                <p><small style="color: #888;">Se você não solicitou esta alteração, por favor, ignore este e-mail. Nenhuma mudança será feita em sua conta.</small></p>
            </div>
        `;
    }

    private static generateResetToken(): string {
        // Gera um número aleatório entre 100000 e 999999
        return randomInt(100000, 1000000).toString();
    }

    public async execute(input: InputDTO): Promise<OutputDTO> {

        const now: Date = new Date();

        // 1. Validação de email
        const is_email_valid: boolean = await this.mailValidation.hasValidDomain(input.email);
        if (!is_email_valid) throw new AppError("O domínio deste e-mail é inválido.", 400, "INVALID_EMAIL_DOMAIN");
        
        // 2. Validacao de usuario
        const user: User | null = await this.userRepository.findUserByEmail(input.email);
        if (!user) throw new AppError("E-mail inválido.", 404, "EMAIL_NOT_FOUND");
        
        const existing_token: PasswordResetToken | null = await this.passwordResetRepository.findPasswordResetTokenByUserId(user.id);
        
        if (existing_token) {

            //token vencido
            if (now.getTime() > new Date(existing_token.expires_at).getTime()){

                await this.passwordResetRepository.deletePasswordResetToken(existing_token.id);

            //token válido
            } else {

                //token válido barrado no cool down
                const diff_ms:number = now.getTime() - new Date(existing_token.created_at).getTime();

                if ( diff_ms < ONE_MINUTE_COOL_DOWN_MS){
                    throw new AppError(
                    `Aguarde 
                        ${(ONE_MINUTE_COOL_DOWN_MS - diff_ms)*1000}
                    segundos para pedir outro código` )
                }

                //token válido já depois de ter passado no cool down
                await this.passwordResetRepository.deletePasswordResetToken(existing_token.id);

                // 4. Geração dos dados do novo token
                const reset_token: string = ForgotPasswordSendEmailUsecase.generateResetToken();
                const reset_token_id: string = randomUUID();

                const resetPasswordCodeEntity: PasswordResetToken = PasswordResetToken.buildPasswordResetToken({
                    id: reset_token_id,
                    user_id: user.id,
                    token: reset_token,
                    now: now.toISOString()
                });

                // 5. Persistência
                await this.passwordResetRepository.savePasswordResetToken(resetPasswordCodeEntity);


            }

        }

        

        

        

        // 6. Envio de e-mail
        await this.mailProvider.sendMail({
            to: user.email,
            subject: EMAIL_SUBJECT,
            body: ForgotPasswordSendEmailUsecase.generateEmailHTML(reset_token)
        });

        return { email: user.email };
    }
}