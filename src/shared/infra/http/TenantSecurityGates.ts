import type { RequestHandler } from "express";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { ensureStoreSelectedMiddleware } from "./middlewares/ensureStoreSelectedMiddleware.js";
import { ensureSubscriptionActiveMiddleware } from "./middlewares/ensureSubscriptionActiveMiddleware.js";

// Exportamos o tipo das chaves para o TypeScript usar como contrato
export type SecurityLevel = 'PUBLIC' | 'REQUIRE_AUTH' | 'REQUIRE_STORE' | 'REQUIRE_ACTIVE_SUBSCRIPTION';

export const TenantGates: Record<SecurityLevel, RequestHandler[]> = {
    PUBLIC: [],
    REQUIRE_AUTH: [
        authMiddleware
    ],
    REQUIRE_STORE: [
        authMiddleware, 
        ensureStoreSelectedMiddleware
    ],
    REQUIRE_ACTIVE_SUBSCRIPTION: [
        authMiddleware, 
        ensureStoreSelectedMiddleware, 
        ensureSubscriptionActiveMiddleware
    ]
};