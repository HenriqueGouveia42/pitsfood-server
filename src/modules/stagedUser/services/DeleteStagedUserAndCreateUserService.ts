import type { IUnitOfWork } from "../../../shared/infra/uow/interface/uow.interface.js";
import type { User } from "../../user/entities/user.js";
import type { StagedUser } from "../entities/stagedUser.js";
import type { ITransactionRepositories } from "../../../shared/infra/uow/interface/uow.interface.js";

type deleteStagedUserAndCreateUserRepos = Pick<ITransactionRepositories,
    "stagedUserRepository" | "userRepository"
>;

export class DeleteStagedUserAndCreateUserService{

    constructor(private uow: IUnitOfWork) {}

    async execute(staged_user: StagedUser, user: User): Promise<void>{

        await this.uow.transaction<void, deleteStagedUserAndCreateUserRepos>(async (repositories) => {

            await repositories.stagedUserRepository.deleteStagedUserById(staged_user.id);
            await repositories.userRepository.saveUser(user);
        })

    }

}