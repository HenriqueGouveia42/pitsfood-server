import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { ITransactionRepositories, IUnitOfWork } from "../../../../shared/infra/uow/interface/uow.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import type { PasswordResetToken } from "../../entities/passwordResetToken.js";
import type { User } from "../../entities/user.js";

type updateForgotRepos = Pick<ITransactionRepositories,
    "userRepository" |
    "resetPasswordRepository"

> 

export interface IUpdateForgottenPassword {
    updated_password_user: User,
    password_reset_token: PasswordResetToken,
}

export class UpdateForgottenPasswordAndConsumeTokenService {

    constructor(
        private uow: IUnitOfWork,
    ){}

    async execute({ updated_password_user, password_reset_token }: IUpdateForgottenPassword ): Promise<void> {

        await this.uow.transaction<void, updateForgotRepos>(async (repositories) => {

            await repositories.userRepository.updateSavedUser(updated_password_user); //atualiza o user no banco

            await repositories.resetPasswordRepository.deletePasswordResetToken(password_reset_token.id);

        })
    }

}