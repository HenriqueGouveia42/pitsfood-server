import type { IStagedUserRepository } from "../../repositories/staged_user.repository.interface.js";
import  type { IUserRepository } from "../../../user/repositories/user.repository.interface.js"
import { StagedUser } from "../../entities/stagedUser.js";
import { User } from "../../../user/entities/user.js";
import { UserRole, type UserProps } from "../../../user/entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";

interface CheckVerificationCodeStagedUserRequestUseCase{
    email: string,
    verificationCode: string
}

export class CheckVerificationCodeStageUserUseCase{

    constructor(
        private stagedUserRepo: IStagedUserRepository
    ){}

    async execute( { email, verificationCode }: CheckVerificationCodeStagedUserRequestUseCase){

        const stagedUser: StagedUser | null = await this.stagedUserRepo.findStagedUserByEmail(email);

        if(!stagedUser){
            throw new AppError("Usuario staged nao encontrado", 404, "STAGED_USER_NOT_FOUND");
        }

        if (stagedUser.verificationCode != verificationCode){
            throw new AppError("Codigo de verificacao incorreto", 400, "INCORRECT_CODE");
        }

        const now: string = new Date().toISOString();

        const userProps: UserProps = {
            user_id: stagedUser.id,
            store_id: null,
            email,
            username: stagedUser.username,
            password_hash: stagedUser.password_hash,
            created_at: now,
            updated_at: now,
            role: UserRole.GESTOR,
            active: true,
            must_change_password: false
        }

        const user: User = User.restore(userProps);

        await this.stagedUserRepo.deleteStagedUserAndCreateUser(stagedUser, user);

    }

}