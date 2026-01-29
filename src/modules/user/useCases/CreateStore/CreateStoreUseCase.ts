import { Store } from "../../../store/entities/store.js";
import type { IStoreRepository } from "../../../store/repositories/store.repository.interface.js";
import type { IUserRepository } from "../../repositories/user.repository.interface.js";
import { User } from "../../entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { UserRole } from "../../../../generated/prisma/enums.js";

export interface ICreateStoreUseCase{
    name: string,
    cnpj: string | null,
    active: boolean,
    owner_id: string,
}

export class CreateStoreUseCase{

    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository
    ) {}

    async execute({
        name,
        cnpj,
        active,
        owner_id,
    }: ICreateStoreUseCase){

        const user: User | null = await this.userRepository.findSavedUserById(owner_id);

        if (!user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        if (user.role != UserRole.GESTOR) throw new AppError("'role' nao permitido", 403, "INVALID_ROLE")
        
        if (user.storeId != null) throw new AppError("Usuario já tem uma loja", 403, "ALREADY_HAS_STORE");

        const created_store: Store = Store.buildStore(
            name,
            active,
            cnpj,
            owner_id
        );

        await this.storeRepository.saveStore(created_store);

    }
}