import { CacheKeys } from "../../../../../shared/constants/cache-keys.js";
import type { ICacheProvider } from "../../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { TEN_MINUTES_IN_SECONDS } from "../../login/LoginUseCase.js";
import type { PendingDeviceRequestDTO } from "../../../dtos/PendingDeviceRequest.dto.js";

export class GetPendingDevicesUseCase {
    constructor(private cacheProvider: ICacheProvider) {}

    async execute(store_id: string): Promise<PendingDeviceRequestDTO[]> {
        const storePendingKey: string = CacheKeys.Store.PENDING_DEVICES(store_id);
        
        let pendingList: PendingDeviceRequestDTO[] | null = await this.cacheProvider.get<PendingDeviceRequestDTO[]>(storePendingKey);
        
        if (!pendingList) return [];

        const now: number = Date.now();

        // Limpa sob demanda para não retornar lixo expirado ao gestor
        const validPendingList: PendingDeviceRequestDTO[] = pendingList.filter(
            (req: PendingDeviceRequestDTO) => (now - req.requested_at < TEN_MINUTES_IN_SECONDS * 1000)
        );

        return validPendingList;
    }
}