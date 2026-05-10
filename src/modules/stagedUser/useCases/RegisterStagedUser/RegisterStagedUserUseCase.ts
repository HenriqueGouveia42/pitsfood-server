import { hash } from "bcryptjs";
import { StagedUser } from "../../entities/stagedUser.js";
import type { IStagedUserRepository } from "../../repositories/interfaces/staged_user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import { randomInt, randomUUID } from 'node:crypto';
import type { User } from "../../../user/entities/user.js";

// NOVO IMPORT: Injetando a interface genérica do provedor de e-mail
import type { IMailProvider } from "../../../../shared/providers/EmailProvider/interface/IMailProvider.js";

import type { IEmailValidationProvider } from "../../../../shared/providers/EmailValidationProvider/interface/IEmailValidationProvider.js";
import type { IHashedStringProvider } from "../../../../shared/providers/HashedStringProvider/models/IHashedStringProvider.js";

export interface SendVerificationCodeToEmailUseCaseRequest {
    email: string,
    username: string,
    password: string,
    cpf_cnpj: string,
    phone: string | null
}

export class RegisterStagedUserUseCase {

    constructor(
        private stagedUserRepository: IStagedUserRepository,
        private userRepository: IUserRepository,
        private mailProvider: IMailProvider,
        private validationEmailProvider: IEmailValidationProvider,
        private hashedStringProvider: IHashedStringProvider
    ) {}

    async execute({ email, username, password, cpf_cnpj, phone }: SendVerificationCodeToEmailUseCaseRequest) {

        const stagedUserAlreadyExists: StagedUser | null = await this.stagedUserRepository.findStagedUserByEmail(email);

        if (stagedUserAlreadyExists) {
            const isExpired: boolean = new Date() > new Date(stagedUserAlreadyExists.expiresAt);

            if (isExpired) {
                await this.stagedUserRepository.deleteStagedUserById(stagedUserAlreadyExists.id);
            } else {
                throw new AppError(`Confirme o código de acesso enviado para ${email}`, 400, "STAGED_USER_ALREADY_EXISTS");
            }
        }

        const userAlreadyExists: User | null = await this.userRepository.findUserByEmail(email);
        if (userAlreadyExists) throw new AppError("Usuario já cadastrado", 400, "USER_ALREADY_EXISTS");

        const domain: string | undefined = email.split('@')[1];
        if (!domain) throw new AppError("Formato de e-mail inválido.", 400, "INVALID_EMAIL_FORMAT");
        
        const is_email_valid: boolean = await this.validationEmailProvider.hasValidDomain(email);
        if (!is_email_valid) throw new AppError("E-mail inválido", 404, "INVALID_EMAIL");

        const CPF_CNPJ_user_already_exists: User | null = await this.userRepository.findUserByCPFCNPJ(cpf_cnpj);
        if (CPF_CNPJ_user_already_exists) throw new AppError("Já existe um usuário com este CPF/CPNJ cadastrado no sistema", 422, "CPF_CNPJ_ALREADY_EXISTS");

        const verification_code: string = randomInt(100000, 1000000).toString();
        const hashedPassword: string = await this.hashedStringProvider.hashString(password);
        const now: Date = new Date();

        // Expira em 10 minutos
        const codeExpiresAtDate: Date = new Date(now.getTime() + (10 * 60 * 1000));
        // Expira em 24 horas
        const stagedUserExpiresAtDate: Date = new Date(now.getTime() + (24 * 60 * 60 * 1000));

        const stagedUser: StagedUser = StagedUser.buildStagedUser({
            id: randomUUID(),
            email,
            username,
            password_hash: hashedPassword,
            verification_code,
            last_verification_code_sent_at: now.toISOString(),
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            expires_at: stagedUserExpiresAtDate.toISOString(),
            code_expires_at: codeExpiresAtDate.toISOString(),
            cpf_cnpj,
            phone
        });

        await this.stagedUserRepository.saveStagedUser(stagedUser);

        const emailTemplate = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Bem-vindo à Manga Food!</h2>
                <p>Use o código abaixo para validar seu cadastro:</p>
                <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; width: fit-content;">
                    <strong style="font-size: 24px; letter-spacing: 3px;">${verification_code}</strong>
                </div>
                <p><small>Este código expira em 10 minutos.</small></p>
            </div>
        `;

        await this.mailProvider.sendMail({
            to: email,
            subject: "Seu código de verificação de sua nova conta Manga Food",
            body: emailTemplate
        });
    }
}