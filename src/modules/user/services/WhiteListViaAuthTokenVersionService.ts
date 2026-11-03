import { CacheKeys } from "../../../shared/constants/cache-keys.js";
import type { ICacheProvider } from "../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";

export type WhiteListInputDTO = {
    user_id: string
}

export type WhiteListOutputDTO = {
    tokenVersion: number
}

export interface IWhiteListViaAuthTokenVersionService {
    execute({ user_id }: WhiteListInputDTO): Promise<WhiteListOutputDTO>;
}

export class WhiteListViaAuthTokenVersionService implements IWhiteListViaAuthTokenVersionService {
    constructor(
        private cacheProvider: ICacheProvider
    ){}

    async execute({ user_id }: WhiteListInputDTO): Promise<WhiteListOutputDTO> {

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