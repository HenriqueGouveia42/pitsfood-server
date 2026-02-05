import type { IStoreRepository } from "../../repositories/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import type { ITokenProvider } from "../../../user/providers/token.provider.interface.js";
import type { ILoginResponse } from "../../../user/useCases/login/loginUseCase.js";

import { Store } from "../../entities/store.js";
import type { StoreProps } from "../../entities/store.js";
import { User, UserRole } from "../../../user/entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";

type UseCaseRequestDTO = {
    user_id: string
    store_id_to_login: string,
    token_version: number,
    current_store_id: string
}

export class LoginIntoStoreUseCase{
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private tokenProvider: ITokenProvider
        
    ){}

    public async execute({user_id, store_id_to_login, token_version, current_store_id}: UseCaseRequestDTO): Promise<ILoginResponse>{

        if (current_store_id) throw new AppError("Usuario já está vinculado a uma loja. Deslogue da loja atual primeiro para entrar em outra loja", 409, "LOGOUT_FIRST")

        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id_to_login);
        if (!store) throw new AppError("Loja nao encotrada", 404, "STORE_NOT_FOUND");

        const user: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        if (!user.paying_user) throw new AppError("Usuario nao é usuario pago", 403, "NOT_PAYING_USER"); //SO DEVE USAR ESSE USECASE O DONO DA LOJA QUERENDO LOGAR EM SUA LOJA
        if (user.role != UserRole.GESTOR) throw new AppError("Usuario nao é gestor", 403, "INVALID_USER_ROLE");

        if(store.ownerId != user.id) throw new AppError("Essa loja nao pertence a esse usuario", 403, "STORE_MISMATCH");

        //atualizar o store_id do usuario no banco de dados
        await this.userRepository.loginUserIntoStore(user, store);
        
        //tendo passado todas essa validacoes, agora preciso criar um novo token JWT para o usuario utilizar.
        //esse token agora vai ter os dados da loja selecionada

        const token = this.tokenProvider.generateToken(
            user.id,
            user.role,
            store.id,
            user.mustChangePassword,
            token_version, //passamos o mesmo para o user nao precisar logar novamente
            user.paying_user
        )

        const response: ILoginResponse = {
            token,
            user:{
                id: user.id,
                store_id: store.id,
                username: user.username,
                role: user.role,
                must_change_password: user.mustChangePassword,
                is_paying_user: user.paying_user,
                token_version: token_version
            }
        }

        return response;
        
    }
}