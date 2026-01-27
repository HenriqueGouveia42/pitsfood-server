import type { IStoreRepository } from "../../repositories/store.repository.interface.js";
import { Store } from "../../entities/store.js";
import type { User } from "../../../user/entities/user.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";

interface ICreateStoreUseCase{
    store_name: string,
    cnpj: string | null,
    active: boolean,
    owner_id: string
}

export class CreateStoreUseCase {

    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository
    ){}

    public async execute( { store_name, cnpj, active=true, owner_id }: ICreateStoreUseCase  ): Promise<Store> {

        const user_trying_to_create_store: User | null = await this.userRepository.findSavedUserById(owner_id);

        //REGRA ONDE UM USER SO PODE TER UMA UNICA LOJA
        if (user_trying_to_create_store?.storeId != null){
            throw new AppError("Esse usuario ja tem uma loja", 403, "ALREADY_HAS_STORE")
        }

        const store: Store = Store.buildStore(store_name, active, cnpj, owner_id);

        await this.storeRepository.saveStore(store);

        return store;

    }
}