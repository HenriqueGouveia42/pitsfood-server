import { hash } from "bcryptjs";
import { StagedUser } from "../../entities/stagedUser.js";
import type { IStagedUserSendEmail } from "../../providers/staged.user.send.email.interface.js"
import type { IStagedUserRepository } from "../../repositories/staged_user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";

export interface SendVerificationCodeToEmailUseCaseRequest{
    email: string,
    username: string,
    password: string
}

export class RegisterStagedUserUseCase{

    constructor(
        private stagedUserRepository: IStagedUserRepository,
        private stagedUserSendEmail: IStagedUserSendEmail
    ){}

    async execute( { email, username, password  }: SendVerificationCodeToEmailUseCaseRequest ){

        const stagedUserAlreadyExists = await this.stagedUserRepository.findStagedUserByEmail(email);

        if (stagedUserAlreadyExists){
            throw new AppError("Usuario já existe e está só esperando colocar o codigo de confirmacao", 400, "STAGED_USER_ALREADY_EXISTS");
        }

        const verification_code: string = Math.floor(100000 + Math.random() * 900000).toString();

        const hashedPassword = await hash(password, 8);

        const stagedUser: StagedUser = StagedUser.buildStagedUser(
            email,
            username,
            hashedPassword,
            verification_code,
        )

        await this.stagedUserRepository.saveStagedUser(stagedUser);

        await this.stagedUserSendEmail.sendVerificationCodeToEmail(email, verification_code);


    }
}