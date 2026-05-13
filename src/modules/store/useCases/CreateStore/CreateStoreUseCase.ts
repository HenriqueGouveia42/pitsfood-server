import { Store, type BuildStoreProps } from "../../../store/entities/store.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import { User } from "../../../user/entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { UserRole } from "../../../../generated/prisma/enums.js";

export interface ICreateStoreUseCase{
    name: string,
    cnpj: string | null,
    owner_id: string,
    affiliate_id: string | null
}

export class CreateStoreUseCase{

    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository
    ) {}


    async execute({
        name,
        cnpj,
        owner_id,
        affiliate_id
    }: ICreateStoreUseCase){

        const user: User | null = await this.userRepository.findSavedUserById(owner_id);
        if (!user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        if (user.role != UserRole.GESTOR) throw new AppError("'role' nao permitido", 403, "INVALID_ROLE");
        if(user.storeId) throw new AppError("Um GESTOR pago pode ter varias lojas", 404, "INVALID_PAYING_USER");

        const store_id: string = crypto.randomUUID().toString();
        const now: string = new Date().toISOString();

        const build_store_props: BuildStoreProps = {
            store_id: store_id,
            now_date: now,
            name: name,
            active: true,
            cnpj: cnpj ? cnpj : null,
            owner_id: user.id,
            store_icon_url: null,
            affiliate_id: affiliate_id ? affiliate_id : null

        }

        
        const created_store: Store = Store.buildStore(build_store_props);

        const alreadyExists: boolean = await this.storeRepository.storeWithThisNameExists(created_store.name);
        if (alreadyExists) throw new AppError("Já existe uma loja com esse nome", 409, "STORE_WITH_THIS_NAME_ALREADY_EXISTS");

        await this.storeRepository.saveStore(created_store);

    }
}