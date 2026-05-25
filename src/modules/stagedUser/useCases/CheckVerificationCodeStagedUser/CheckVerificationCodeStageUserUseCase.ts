import type { IStagedUserRepository } from "../../repositories/interfaces/staged_user.repository.interface.js";
import { StagedUser } from "../../entities/stagedUser.js";
import { User } from "../../../user/entities/user.js";
import { UserRole } from "../../../user/entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { BuildUserProps } from "../../../user/entities/user.js";
import type { DeleteStagedUserAndCreateUserService } from "../../services/DeleteStagedUserAndCreateUserService.js";

interface CheckVerificationCodeStagedUserRequestUseCase{
    email: string,
    verificationCode: string
}

export class CheckVerificationCodeStageUserUseCase{

    constructor(
        private stagedUserRepo: IStagedUserRepository,
        private deleteStagedUserAndCreateUserService: DeleteStagedUserAndCreateUserService
    ){}

    async execute( { email, verificationCode }: CheckVerificationCodeStagedUserRequestUseCase){

        const stagedUser: StagedUser | null = await this.stagedUserRepo.findStagedUserByEmail(email);
        if(!stagedUser) throw new AppError("Usuario staged nao encontrado", 404, "STAGED_USER_NOT_FOUND");

        if (stagedUser.verificationCode != verificationCode) throw new AppError("Codigo de verificacao incorreto", 400, "INCORRECT_CODE");

        const now: string = new Date().toISOString();

        const buildUserProps: BuildUserProps = {
            user_id: stagedUser.id,
            nowDate: now,
            username: stagedUser.username,
            password_hash: stagedUser.password_hash,
            role: UserRole.GESTOR,
            email: stagedUser.email,
            store_id: null, //o gestor que cria a conta paga pode ter varias lojas, por isso é null aqui
            must_change_password: false,
            is_paying_user: true,
            cpf_cnpj: stagedUser.cpf_cnpj,
            phone: stagedUser.phone ? stagedUser.phone : null,
        }

        const user: User = User.buildUser(buildUserProps);

        await this.deleteStagedUserAndCreateUserService.execute(stagedUser, user);

    }

}