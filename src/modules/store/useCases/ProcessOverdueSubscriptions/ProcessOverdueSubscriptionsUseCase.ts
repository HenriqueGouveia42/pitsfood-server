import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { Store } from "../../entities/store.js";

export class ProcessOverdueSubscriptionsUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private cacheProvider: ICacheProvider
    ) {}

    public async execute(): Promise<void> {
        
        const now = new Date();

        //1 - Busca no banco APENAS as lojas que estão ATIVAS, mas que a data de expiração já passou (ou expira agora)
        const expiredStores: Store[] = await this.storeRepository.findActiveAndExpiredStores(now);

        if (expiredStores.length === 0) {
            console.log("[CRON] 23:58 - Nenhuma loja inadimplente encontrada neste ciclo.");
            return;
        }

        console.log(`[CRON] 23:58 - Encontradas ${expiredStores.length} lojas com pagamento atrasado. Iniciando bloqueio...`);

        const storeIdsToBlock: string[] = expiredStores.map(store => store.id);

        //2 - Atualiza o banco de dados em lote (Batch Update) para máxima performance
        await this.storeRepository.markStoresAsPastDue(storeIdsToBlock);

        //3 - Limpeza do Cache (Redis)
        // Precisamos deletar a chave de status de cada loja bloqueada para que o Middleware expulse eles

        const cacheInvalidationPromises = storeIdsToBlock.map(storeId => {
            const cacheKey = CacheKeys.Store.SUBSCRIPTION_STATUS(storeId);
            return this.cacheProvider.invalidate(cacheKey);
        });

        // Roda todas as invalidações no Redis em paralelo
        await Promise.all(cacheInvalidationPromises);

        console.log(`[CRON] 23:58 - Sucesso! ${expiredStores.length} lojas alteradas para PAST_DUE e caches invalidados.`);
    }
}