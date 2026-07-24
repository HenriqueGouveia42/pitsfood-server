import { CacheKeys } from "../../../shared/constants/cache-keys.js";
import type { ICacheProvider } from "../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";

interface inputDTO {
    user_id: string
}

export interface outputDTO {
    tokenVersion: number
}

export class WhiteListViaAuthTokenVersionService {
    constructor(
        private cacheProvider: ICacheProvider
    ){}

    async execute({ user_id }: inputDTO): Promise<outputDTO> {

        const token_version: number = Date.now()

        const cache_key: string = CacheKeys.User.TOKEN_VERSION(user_id);

        await this.cacheProvider.save(
            cache_key,
            token_version.toString(),
            86400 //um dia
        )

        return { tokenVersion: token_version }
    }
}