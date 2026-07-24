import { AppError } from "../../../../../shared/errors/AppError.js";
import { CacheKeys } from "../../../../../shared/constants/cache-keys.js";
import type { ICacheProvider } from "../../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import type { IUserRepository } from "../../../repositories/interfaces/user.repository.interface.js";
import { User } from "../../../entities/user.js";
import type { AuthorizeDeviceService } from "../../../services/AuthorizeDeviceService.js";
import type { PendingDeviceRequestDTO } from "../../../dtos/PendingDeviceRequest.dto.js";

export type ApproveDeviceInputDTO = {
    readonly manager_store_id: string;
    readonly target_user_id: string;
    readonly device_id: string;
    readonly device_name: string;
}

export class ApproveDeviceByManagerUseCase {
    constructor(
        private authorizeDeviceService: AuthorizeDeviceService,
        private userRepository: IUserRepository,
        private cacheProvider: ICacheProvider
    ) {}

    async execute(input: ApproveDeviceInputDTO): Promise<void> {
        
        const targetUser: User | null = await this.userRepository.findSavedUserById(input.target_user_id);
        
        // Proteção cross-tenant rígida
        if (!targetUser) throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
        if (targetUser.storeId !== input.manager_store_id) { 
            throw new AppError("Usuário alvo não pertence a esta loja.", 403, "STORE_MISMATCH");
        }

        // 1. O serviço centralizado resolve o núcleo do negócio
        await this.authorizeDeviceService.execute(input.target_user_id, input.device_id, input.device_name);

        // 2. Ação específica desta via: Retirar o aparelho da fila do painel do gestor
        const storePendingKey: string = CacheKeys.Store.PENDING_DEVICES(input.manager_store_id);
        const pendingList: PendingDeviceRequestDTO[] | null = await this.cacheProvider.get<PendingDeviceRequestDTO[]>(storePendingKey);
        
        if (pendingList) {
            const updatedPendingList: PendingDeviceRequestDTO[] = pendingList.filter(
                (req: PendingDeviceRequestDTO) => req.device_id !== input.device_id
            );
            await this.cacheProvider.overwrite(storePendingKey, updatedPendingList);
        }
    }
}