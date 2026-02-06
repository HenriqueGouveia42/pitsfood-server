import { Store } from "../../../store/entities/store.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import { User } from "../../../user/entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { UserRole } from "../../../../generated/prisma/enums.js";

export interface ICreateStoreUseCase{
    name: string,
    cnpj: string | null,
    owner_id: string,
}

function toTitleCase(text: string): string {
  if (!text) return "";
  
  return text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
    }: ICreateStoreUseCase){

        const user: User | null = await this.userRepository.findSavedUserById(owner_id);
        if (!user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        if (user.role != UserRole.GESTOR) throw new AppError("'role' nao permitido", 403, "INVALID_ROLE");

        const finalName: string = toTitleCase(name);

        const alreadyExists: boolean = await this.storeRepository.storeWithThisNameExists(finalName);

        if (alreadyExists) throw new AppError("Já existe uma loja com esse nome", 409, "STORE_WITH_THIS_NAME_ALREADY_EXISTS")
        
        const created_store: Store = Store.buildStore(
            finalName,
            true,
            cnpj,
            owner_id
        );

        await this.storeRepository.saveStore(created_store);

    }
}