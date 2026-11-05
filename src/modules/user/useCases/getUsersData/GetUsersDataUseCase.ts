import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { User } from "../../entities/user.js";
import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js";
import type { AuthorizedDeviceProps } from "../../entities/user.js";

export interface GetUsersDataUseCaseOutputDTO {
    name: string;
    user_id: string;
    role: string;
    active: boolean;
    email: string;
    cpf_cnpj: string | null,
    phone: string | null,
    authorized_devices: AuthorizedDeviceProps[]
}

export class GetUsersDataUseCase {

    constructor(
        private userRepository: IUserRepository,
        private cacheProvider: ICacheProvider
    ){}

    async execute(store_id: string, active: string): Promise<GetUsersDataUseCaseOutputDTO[]> {

        const cacheKey: string = CacheKeys.User.USERS_DATA(store_id);

        const cachedUsers = await this.cacheProvider.get<GetUsersDataUseCaseOutputDTO[]>(cacheKey);

        if (cachedUsers) {
            return cachedUsers; 
        }
        
        //CACHE MISS

        const active_filter: boolean = active === 'true' ? true : false;
        const users: User[] = await this.userRepository.listAllSavedUsers(store_id, active_filter);

        const usersDataToReturn: GetUsersDataUseCaseOutputDTO[] = users.map((user) => ({
            name: user.username, 
            user_id: user.id,
            role: user.role,
            active: user.active,
            email: user.email,
            cpf_cnpj: user.cpf_cnpj,
            phone: user.phone ? user.phone : null,
            authorized_devices: user.authorized_devices ? user.authorized_devices : []
        }));

        await this.cacheProvider.save(
            cacheKey,
            usersDataToReturn,
            86400
        );

        return usersDataToReturn;
    }
}