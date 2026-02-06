import type { IUserRepository } from "../../repositories/user.repository.interface.js";
import { User } from "../../entities/user.js";
import bcrypt from "bcryptjs";
import { UserRole } from "../../entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";
import type { Store } from "../../../store/entities/store.js";

interface RegisterEmployeeUseCaseRequest{
    name: string,
    role: string,
    plain_text_password: string,
    userId: string,
    email: string
}

export interface RegisterEmployeeUseCaseResponse{
    name: string,
    role: string,
}

export class RegisterEmployeeUseCase{
   constructor(
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository
   ){} 

   async execute({ name, role, plain_text_password, userId, email}: RegisterEmployeeUseCaseRequest): Promise<RegisterEmployeeUseCaseResponse>{
    
        const userAlreadyExists = await this.userRepository.findUserByEmail(email);

        if (userAlreadyExists) throw new AppError("Este e-mail está indisponível.", 400, "INVALID_EMAIL");

        const manager_user: User | null = await this.userRepository.findSavedUserById(userId);
        if (manager_user == null) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        if (manager_user.storeId === null) throw new AppError("O usuario nao pode cadastrar funcionarios sem antes criar uma loja", 400, "MUST_CREATE_STORE");

        if (manager_user.role != UserRole.GESTOR) throw new AppError("Usuario precisa ser GESTOR para criar uma loja", 403, "MUST_BE_GESTOR");
        if (!manager_user.paying_user) throw new AppError("Usuario gestor precisa ser um gestor pago, ou seja, aquele que criou a loja!");

        const store: Store | null = await this.storeRepository.findSavedStoreById(manager_user.storeId);
        if (store === null) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND")
        if (store.ownerId != manager_user.id) throw new AppError("O usuario não é o dono da loja", 403, "MUST_BE_THE_OWNER");


        const hashed_password = await bcrypt.hash(plain_text_password, 8);

        const user: User = User.buildUser(
            name,
            hashed_password,
            role as UserRole,
            email,
            store.id,
            true, //'must_change_password' deve ser true pois um funcionario recem criado PRECISA que mudar sua senha inicialmente criada pelo gestor
            false //'is_paying_user' aqui precisa ser false, pois esse é um usuario criado pelo usuario gestor inicial
        ); 

        await this.userRepository.saveUser(user);

        const response: RegisterEmployeeUseCaseResponse = {
            name: user.username,
            role: user.role,
        }

        return response;
    }
}