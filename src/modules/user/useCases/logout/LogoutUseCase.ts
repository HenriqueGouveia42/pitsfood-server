import type { IUserRepository } from "../../repositories/user.repository.interface.js";
import { User } from "../../entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";

type UseCaseRequestDTO = {
    user_id: string
}

export class LogoutUseCase{
    constructor(
        private userRepository: IUserRepository
    ){}

    public async execute({user_id}: UseCaseRequestDTO){

        const user: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT _FOUND");

        if (user.paying_user){ //somente usuarios pagos podem ficar variando o "store_id"
            await this.userRepository.logoutUserFromStore(user);
        }

    }
}