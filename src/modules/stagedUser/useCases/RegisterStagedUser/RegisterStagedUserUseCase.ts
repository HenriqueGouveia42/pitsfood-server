import { hash } from "bcryptjs";
import { StagedUser } from "../../entities/stagedUser.js";
import type { IStagedUserSendEmail } from "../../providers/staged.user.send.email.interface.js"
import type { IStagedUserRepository } from "../../repositories/interfaces/staged_user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import { randomInt, randomUUID } from 'node:crypto';
import dns from 'node:dns/promises';
import type { User } from "../../../user/entities/user.js";
import type { MxRecord } from "node:dns";

export interface SendVerificationCodeToEmailUseCaseRequest{
    email: string,
    username: string,
    password: string,
    cpf_cnpj: string,
    phone: string | null
}

export class RegisterStagedUserUseCase{

    constructor(
        private stagedUserRepository: IStagedUserRepository,
        private userRepository: IUserRepository,
        private stagedUserSendEmail: IStagedUserSendEmail,
    ){}

    async execute( { email, username, password, cpf_cnpj, phone }: SendVerificationCodeToEmailUseCaseRequest ){

        const stagedUserAlreadyExists: StagedUser | null = await this.stagedUserRepository.findStagedUserByEmail(email);

        // StagedUser existe no banco
        if (stagedUserAlreadyExists){

            const isExpired: boolean = new Date() > new Date(stagedUserAlreadyExists.expiresAt);

            // Por alguma razão o cron job que deleta os StagedUsers expirados não funcionou, então deletamos aqui!
            if(isExpired){
                await this.stagedUserRepository.deleteStagedUserById(stagedUserAlreadyExists.id);
            } else {
                // Bloqueamos se ele estiver dentro das 24h de validade do cadastro
                throw new AppError(`Confirme o código de acesso enviado para ${email}`, 400, "STAGED_USER_ALREADY_EXISTS");
            }
        }

        const userAlreadyExists: User | null = await this.userRepository.findUserByEmail(email);
        if (userAlreadyExists) throw new AppError("Usuario já cadastrado", 400, "USER_ALREADY_EXISTS");

        const domain: string | undefined = email.split('@')[1];
        
        if (!domain) throw new AppError("Formato de e-mail inválido.", 400, "INVALID_EMAIL_FORMAT");
        
        try {
            // Verifica se o domínio possui servidores de e-mail configurados para receber mensagens
            const mxRecords: MxRecord[] = await dns.resolveMx(domain);

            if (!mxRecords || mxRecords.length === 0) throw new AppError("O domínio deste e-mail não está configurado para receber mensagens.", 400, "INVALID_EMAIL_DOMAIN");
            
        } catch (error) {
            // Cai aqui se o domínio não existir (ex: @gamil.com, @outlok.com)
            throw new AppError("Domínio de e-mail inexistente ou incorreto.", 400, "INVALID_EMAIL_DOMAIN");
        }

        const verification_code: string = randomInt(100000, 1000000).toString();

        const CPF_CNPJ_user_already_exists: User | null = await this.userRepository.findUserByCPFCNPJ(cpf_cnpj);
        if (CPF_CNPJ_user_already_exists) throw new AppError("Já existe um usuário com este CPF/CPNJ cadastrado no sistema", 422, "CPF_CNPJ_ALREADY_EXISTS");
        
        const hashedPassword: string = await hash(password, 8);

        const now: Date = new Date();

        // Avancando 10 minutos (validade do codigo)
        const codeExpiresAtDate: Date = new Date(now.getTime() + (10 * 60 * 1000));

        // Avancando 24 horas (validade do StagedUser)
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
        })

        await this.stagedUserRepository.saveStagedUser(stagedUser);

        await this.stagedUserSendEmail.sendVerificationCodeToEmail(email, verification_code);

    }
}