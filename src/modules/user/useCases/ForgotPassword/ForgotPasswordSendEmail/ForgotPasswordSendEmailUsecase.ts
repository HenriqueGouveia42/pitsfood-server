import { randomInt, randomUUID } from "node:crypto";
import type { IMailProvider } from "../../../../../shared/providers/EmailProvider/interface/IMailProvider.js";
import type { IEmailValidationProvider } from "../../../../../shared/providers/EmailValidationProvider/interface/IEmailValidationProvider.js";
import { AppError } from "../../../../../shared/errors/AppError.js";
import type { IPasswordResetRepository } from "../../../repositories/interfaces/password.reset.repository.interface.js";
import type { IUserRepository } from "../../../repositories/interfaces/user.repository.interface.js";

import type { User } from "../../../entities/user.js";
import { PasswordResetToken } from "../../../entities/passwordResetToken.js";

import { SYSTEM_NAME } from "../../../../../config/system_data.js";

export type InputDTO = {
    email: string;
};

type OutputDTO = {
    email: string;
};

const MINUTES_TO_EXPIRE: number = 10;
const EMAIL_SUBJECT: string = `Recuperação de Senha - ${SYSTEM_NAME}`;
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
                <p>Você solicitou a redefinição de sua senha na ${SYSTEM_NAME}. Use o código abaixo para prosseguir com a troca:</p>
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

    //1. Validação de email
    //2. Validação de usuario
    //3. Verifica se token de reset já existe
    //4. Se existir e estiver abaixo do cool-down, lança erro
    //5. Cria ou atualiza o token de reset
    //6. Persiste o token de reset no banco de dados
    //7. Envia o email com o token de reset

    public async execute(input: InputDTO): Promise<OutputDTO> {

        const now: Date = new Date();

        //1. Validação de email
        const is_email_valid: boolean = await this.mailValidation.hasValidDomain(input.email);
        if (!is_email_valid) throw new AppError("O domínio deste e-mail é inválido.", 400, "INVALID_EMAIL_DOMAIN");
        
        //2. Validacao de usuario
        const user: User | null = await this.userRepository.findUserByEmail(input.email);
        if (!user) throw new AppError("E-mail inválido.", 404, "EMAIL_NOT_FOUND");
        
        //3. Verifica se o token de reset já existe
        const existing_token: PasswordResetToken | null = await this.passwordResetRepository.findPasswordResetTokenByUserId(user.id);
        
        //4. Se existir e estiver abaixo do cool-down, lança erro
        if (existing_token) {

            const diff_ms:number = now.getTime() - new Date(existing_token.created_at).getTime();

            if ( diff_ms < ONE_MINUTE_COOL_DOWN_MS){
                throw new AppError(
                `Aguarde ${Math.ceil((ONE_MINUTE_COOL_DOWN_MS - diff_ms)/1000)} segundos para pedir outro código` )
            }

        }

        //5. Cria ou atualiza o token de reset
        const reset_token: string = ForgotPasswordSendEmailUsecase.generateResetToken();

        const resetPasswordCodeEntity: PasswordResetToken = PasswordResetToken.buildPasswordResetToken({
            id: existing_token ? existing_token.id : randomUUID(),
            user_id: user.id,
            token: reset_token,
            now: now.toISOString()
        });

        //6. Persiste o token de reset no banco de dados
        await this.passwordResetRepository.savePasswordResetToken(resetPasswordCodeEntity);

        //7. Envia o email com o token de reset
        await this.mailProvider.sendMail({
            to: user.email,
            subject: EMAIL_SUBJECT,
            body: ForgotPasswordSendEmailUsecase.generateEmailHTML(reset_token)
        });

        return { email: user.email };
    }
}