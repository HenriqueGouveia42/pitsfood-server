import { User } from "../../entities/user.js";
import type { IUserRepository } from "../../repositories/user.repository.interface.js";


export interface GetUsersDataUseCaseResponse {
    name: string;
    user_id: string;
    role: string;
    active: boolean;
    email: string;
    cpf_cnpj: string,
    phone: string | null
}

export class GetUsersDataUseCase {

    constructor(
        private userRepository: IUserRepository
    ){}

    async execute(store_id: string, active?: boolean): Promise<GetUsersDataUseCaseResponse[]> {
        
        const users: User[] = await this.userRepository.listAllSavedUsers(store_id);

        const usersDataToReturn: GetUsersDataUseCaseResponse[] = users.map((user) => ({
            name: user.username, 
            user_id: user.id,
            role: user.role,
            active: user.active,
            email: user.email,
            cpf_cnpj: user.cpf_cnpj,
            phone: user.phone ? user.phone : null
        }));

        return usersDataToReturn;
    }
}