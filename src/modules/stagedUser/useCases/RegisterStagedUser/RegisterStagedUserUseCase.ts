import { hash } from "bcryptjs";
import { StagedUser } from "../../entities/stagedUser.js";
import type { IStagedUserSendEmail } from "../../providers/staged.user.send.email.interface.js"
import type { IStagedUserRepository } from "../../repositories/staged_user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import { randomInt } from 'node:crypto';
import type { User } from "../../../user/entities/user.js";

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

        const stagedUserAlreadyExists = await this.stagedUserRepository.findStagedUserByEmail(email);
        if (stagedUserAlreadyExists){ throw new AppError("Usuario já e está só esperando colocar o codigo de confirmacao", 400, "STAGED_USER_ALREADY_EXISTS");}

        const userAlreadyExists = await this.userRepository.findUserByEmail(email);
        if (userAlreadyExists) throw new AppError("Usuario já cadastrado", 400, "USER_ALREADY_EXISTS")

        const verification_code = randomInt(100000, 1000000).toString();

        const CPF_CNPJ_user_already_exists: User | null = await this.userRepository.findUserByCPFCNPJ(cpf_cnpj);
        if (CPF_CNPJ_user_already_exists) throw new AppError("Já existe um usuário com este CPF/CPNJ cadastrado no sistema", 422, "CPF_CNPJ_ALREADY_EXISTS");
        
        const hashedPassword = await hash(password, 8);

        const stagedUser: StagedUser = StagedUser.buildStagedUser(
            email,
            username,
            hashedPassword,
            verification_code,
            cpf_cnpj,
            phone
        )

        await this.stagedUserRepository.saveStagedUser(stagedUser);

        await this.stagedUserSendEmail.sendVerificationCodeToEmail(email, verification_code);


    }
}