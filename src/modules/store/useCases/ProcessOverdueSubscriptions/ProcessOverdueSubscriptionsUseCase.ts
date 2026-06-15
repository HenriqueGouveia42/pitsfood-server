import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { Store } from "../../entities/store.js";

export class ProcessOverdueSubscriptionsUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private cacheProvider: ICacheProvider
    ) {}

    // 1. Busca no banco APENAS as lojas que estão ATIVAS, mas que a data de expiração já passou. Quem guarda a data de expiração é a pŕopria entidade 'Store'
    // 2. Aplica a regra de negócio do Domínio (DDD)
    // 3. Atualiza o banco de dados em lote passando as entidades completas
    // 4 - Limpeza do Cache (Redis)




    public async execute(): Promise<void> {
        
        const now = new Date();

        // 1
        const expiredStores: Store[] = await this.storeRepository.findActiveAndExpiredStores(now);

        if (expiredStores.length === 0) {
            console.log("[CRON] 23:58 - Nenhuma loja inadimplente encontrada neste ciclo.");
            return;
        }

        console.log(`[CRON] 23:58 - Encontradas ${expiredStores.length} lojas com pagamento atrasado. Iniciando bloqueio...`);

        // 2
        const updatedStores: Store[] = expiredStores.map(store => store.markAsPastDue());

        // 3
        await this.storeRepository.updateManyStores(updatedStores);

        // 4
        // Precisamos deletar a chave de status de cada loja bloqueada para que o Middleware expulse eles
        const cacheInvalidationPromises = updatedStores.map(store => {
            const cacheKey: string = CacheKeys.Store.SUBSCRIPTION_STATUS(store.id);
            return this.cacheProvider.invalidate(cacheKey);

        });

        // Roda todas as invalidações no Redis em paralelo
        await Promise.all(cacheInvalidationPromises);

        console.log(`[CRON] 23:58 - Sucesso! ${expiredStores.length} lojas alteradas para PAST_DUE e caches invalidados.`);
    }
}