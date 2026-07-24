import type { IStagedUserRepository } from "../../repositories/interfaces/staged_user.repository.interface.js"
import { StagedUser } from "../../entities/stagedUser.js"
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStagedUserSendEmail } from "../../providers/staged.user.send.email.interface.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import { randomInt } from 'node:crypto';

interface SendVerificationCodeToEmailAgainUseCaseDTO{
    email: string
}

export class SendVerificationCodeToEmailAgainUseCase{
    constructor(
        private stagedUserRepository: IStagedUserRepository,
        private userRepository: IUserRepository,
        private stagedUserSendEmail: IStagedUserSendEmail
    ){}

    public async execute({ email }: SendVerificationCodeToEmailAgainUseCaseDTO){

        // 1. Fail Fast: Se já é usuário cadastrado, encerra logo.
        const user = await this.userRepository.findUserByEmail(email);
        if (user) throw new AppError("Usuario invalido", 409, "USER_ALREADY_IN");

        // 2. Busca o cadastro temporário - StagedUser
        const staged_user = await this.stagedUserRepository.findStagedUserByEmail(email);
        if (!staged_user) throw new AppError("Usuario invalido", 404, "STAGED_USER_NOT_FOUND");

        const now: Date = new Date();

        // 3. Fallback do Cron Job: Limpeza de lixo expirado (> 24h)
        if (now > new Date(staged_user.expiresAt)){
            await this.stagedUserRepository.deleteStagedUserById(staged_user.id);
            throw new AppError("Usuario vencido. Crie sua conta novamente", 404, "STAGED_USER_EXPIRED");
        }

        // 4. Delega a geração e as regras de COOLDOWN (ex: 60s) para a Entidade!
        const new_verification_code: string = randomInt(100000, 1000000).toString();
        const nowIso: string = now.toISOString();
        const newCodeExpiresAt: string = new Date(now.getTime() + (1000 * 60 * 10)).toISOString();

        const staged_user_with_new_verification_code: StagedUser = staged_user.newVerificationCode(
            new_verification_code,
            nowIso,
            newCodeExpiresAt
        );

        // 5. Try/Catch para garantir a consistência)
        // Salva a mutação no banco PRIMEIRO
        await this.stagedUserRepository.saveStagedUser(staged_user_with_new_verification_code);

        try {
            // Tenta o serviço externo (I/O de rede) DEPOIS
            await this.stagedUserSendEmail.sendVerificationCodeToEmail(email, new_verification_code);

        } catch (error) {
            // ROLLBACK MANUAL: Se o Nodemailer falhar, nós desfazemos o update.
            // Salvamos o 'staged_user' antigo (com o código velho) de volta no banco.
            await this.stagedUserRepository.saveStagedUser(staged_user);

            throw new AppError(
                "Não foi possível enviar o e-mail no momento. Tente novamente em instantes.", 
                500, 
                "EMAIL_SERVICE_FAILED"
            );
        }
    }
}