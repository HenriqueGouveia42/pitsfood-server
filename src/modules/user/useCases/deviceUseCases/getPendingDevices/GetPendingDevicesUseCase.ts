import { CacheKeys } from "../../../../../shared/constants/cache-keys.js";
import type { ICacheProvider } from "../../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { TEN_MINUTES_IN_SECONDS } from "../../login/LoginUseCase.js";

export type GetPendingDevicesUseCaseOutputDTO = {
    readonly user_id: string;
    readonly user_name: string;
    readonly device_id: string;
    readonly requested_at: number; // Timestamp para controlar a expiração
}

export class GetPendingDevicesUseCase {
    constructor(private cacheProvider: ICacheProvider) {}

    async execute(store_id: string): Promise<GetPendingDevicesUseCaseOutputDTO[]> {
        
        const storePendingKey: string = CacheKeys.Store.PENDING_DEVICES(store_id);
        
        let pendingList: GetPendingDevicesUseCaseOutputDTO[] | null = await this.cacheProvider.get<GetPendingDevicesUseCaseOutputDTO[]>(storePendingKey);
        
        if (!pendingList) return [];

        const now: number = Date.now();

        // Limpa sob demanda para não retornar lixo expirado ao gestor
        const validPendingList: GetPendingDevicesUseCaseOutputDTO[] = pendingList.filter(
            (req: GetPendingDevicesUseCaseOutputDTO) => (now - req.requested_at < TEN_MINUTES_IN_SECONDS * 1000)
        );

        return validPendingList;
    }
}