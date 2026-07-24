import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../errors/AppError.js";
import { SubscriptionStatus } from "../../../../modules/store/entities/store.enums.js";
import { CacheKeys } from "../../../constants/cache-keys.js";
import { Store } from "../../../../modules/store/entities/store.js";
import type { IStoreRepository } from "../../../../modules/store/repositories/interfaces/store.repository.interface.js";
import type { ICacheProvider } from "../../../providers/interfaces/cacheProvider/ICacheProvider.js";

export function makeEnsureSubscriptionActiveMiddleware(
    storeRepository: IStoreRepository,
    cacheProvider: ICacheProvider
){
    return async function ensureSubscriptionActiveMiddleware(
        req: Request,
        res: Response,
        next: NextFunction
    ){

    if (!req.user){
        throw new AppError("req.user ausente", 404, "REQ_USER_UNDEFINED");
    }

    const { store_id } = req.user;

    if (!store_id) throw new AppError("Contexto de loja não encontrado.", 500, "INTERNAL_SERVER_ERROR");
    
    const cacheKey: string = CacheKeys.Store.SUBSCRIPTION_STATUS(store_id);

    //cache
    let status: SubscriptionStatus | null | undefined = await cacheProvider.get(cacheKey);

    //cache Miss
    if (!status) {
        
        const store: Store | null = await storeRepository.findSavedStoreById(store_id);

        if (!store) throw new AppError("Loja não encontrada no banco de dados.", 404, "STORE_NOT_FOUND");

        status = store.subscription_status;
        //salva no cache por 24h (ou até o Webhook invalidar)
        //webhook é OBRIGADO a limpar essa chave quando o pagamento cair.
        await cacheProvider.save(cacheKey, status, 60 * 60 * 24); 
    }

    //julgamento Final
    if (status !== SubscriptionStatus.ACTIVE) {
        throw new AppError(
            "Sua assinatura não está ativa. Realize o pagamento para acessar este recurso.", 
            402,
            "SUBSCRIPTION_REQUIRED"
        );
    }

    return next();
    }

}