import { User } from "../../entities/user.js";
import type { IUserRepository } from "../../repositories/user.repository.interface.js";


export interface GetUsersDataUseCaseResponse {
    name: string;
    user_id: string;
    role: string;
    active: boolean
}

export class GetUsersDataUseCase {

    constructor(
        private userRepository: IUserRepository
    ){}

    async execute(active?: boolean): Promise<GetUsersDataUseCaseResponse[]> {
        
        const users: User[] = await this.userRepository.listAllSavedUsers(active);

        const usersDataToReturn: GetUsersDataUseCaseResponse[] = users.map((user) => ({
            name: user.username, 
            user_id: user.id,
            role: user.role,
            active: user.active
        }));

        return usersDataToReturn;
    }
}