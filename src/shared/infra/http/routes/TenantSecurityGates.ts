import type { RequestHandler } from "express";
import { makeAuthMiddleware } from "../middlewares/makeAuthMiddleware.js";
import { ensureStoreSelectedMiddleware } from "../middlewares/ensureStoreSelectedMiddleware.js";
import { makeEnsureSubscriptionActiveMiddleware } from "../middlewares/makeEnsureSubscriptionActiveMiddleware.js";
import { makePreAuthMiddleware } from "../middlewares/makePreAuthMiddleware.js";
import { makeEnsureDeviceIsAuthorizedMiddleware } from "../middlewares/makeEnsureDeviceIsAuthorizedMiddleware.js";
import { PrismaUserRepository } from "../../../../modules/user/repositories/implementations/prisma/user.repository.prisma.js";

import { publicRateLimiter, authRateLimiter, tenantRateLimiter } from "../middlewares/rateLimiters.js";
import { RedisCacheProvider } from "../../providers/implementations/cacheProvider/RedisCacheProvider.js";
import { JwtTokenProvider } from "../../../../modules/user/providers/implementations/jwt/token.provider.jwt.js";
import { PrismaStoreRepository } from "../../../../modules/store/repositories/implementations/prisma/store.repository.prisma.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();
const tokenProvider: JwtTokenProvider = new JwtTokenProvider();

const preAuthMiddleware = makePreAuthMiddleware(
    tokenProvider
)

// instanciar o middleware de autenticacao
const authMiddleware = makeAuthMiddleware(
    cacheProvider,
    tokenProvider
)

const ensureDeviceIsAuthorizedMiddleware = makeEnsureDeviceIsAuthorizedMiddleware(userRepository);

const ensureSubscriptionActiveMiddleware = makeEnsureSubscriptionActiveMiddleware(
    storeRepository,
    cacheProvider
)

export type SecurityLevel = 'PUBLIC' | 'REQUIRE_AUTH' | 'REQUIRE_AUTH_AUTHORIZED_DEVICE' | 'REQUIRE_PRE_AUTH' | 'REQUIRE_STORE' | 'REQUIRE_ACTIVE_SUBSCRIPTION';

export const TenantGates: Record<SecurityLevel, RequestHandler[]> = {
    PUBLIC: [
        publicRateLimiter // IP-based para proteger webhooks e rotas expostas
    ],
    REQUIRE_PRE_AUTH: [
        publicRateLimiter, // Ainda não há sessão completa, usamos o limiter público (IP)
        preAuthMiddleware
    ],
    REQUIRE_AUTH: [
        authMiddleware,
        authRateLimiter // INJETADO APÓS o authMiddleware
    ],
    REQUIRE_AUTH_AUTHORIZED_DEVICE:[
        authMiddleware,
        ensureDeviceIsAuthorizedMiddleware,
        authRateLimiter // INJETADO APÓS a validação do device
    ],
    REQUIRE_STORE: [
        authMiddleware,
        ensureDeviceIsAuthorizedMiddleware,
        ensureStoreSelectedMiddleware,
        tenantRateLimiter // INJETADO APÓS garantir que a loja está no req.user
    ],
    REQUIRE_ACTIVE_SUBSCRIPTION: [
        authMiddleware,
        ensureDeviceIsAuthorizedMiddleware, 
        ensureStoreSelectedMiddleware, 
        ensureSubscriptionActiveMiddleware,
        tenantRateLimiter // Usa o mesmo limiter do tenant
    ]
};