import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../errors/AppError.js";
import { cacheProvider } from "../../../providers/CacheProvider/index.js"; // Supondo que você já tem o provider instanciado
import { PrismaStoreRepository } from "../../../../modules/store/repositories/implementations/prisma/store.repository.prisma.js";
import { SubscriptionStatus } from "../../../../modules/store/entities/store.js";

export async function ensureSubscriptionActiveMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const { store_id } = req.user;

    if (!store_id) {
        throw new AppError("Contexto de loja não encontrado.", 500, "INTERNAL_SERVER_ERROR");
    }

    const cacheKey = `store-subscription-status:${store_id}`;

    //tenta pegar do Cache (Rápido)
    let status = await cacheProvider.get(cacheKey);

    //cache Miss? Vai no Banco (Lento, mas necessário na primeira vez)
    if (!status) {
        
        const storeRepository = new PrismaStoreRepository();
        const store = await storeRepository.findSavedStoreById(store_id);

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