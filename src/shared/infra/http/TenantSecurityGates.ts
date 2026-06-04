import type { RequestHandler } from "express";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { ensureStoreSelectedMiddleware } from "./middlewares/ensureStoreSelectedMiddleware.js";
import { ensureSubscriptionActiveMiddleware } from "./middlewares/ensureSubscriptionActiveMiddleware.js";
import { preAuthMiddleware } from "./middlewares/preAuthMiddleware.js";

import { makeEnsureDeviceIsAuthorizedMiddleware } from "./middlewares/makeEnsureDeviceIsAuthorizedMiddleware.js";
import { PrismaUserRepository } from "../../../modules/user/repositories/implementations/prisma/user.repository.prisma.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const ensureDeviceIsAuthorizedMiddleware = makeEnsureDeviceIsAuthorizedMiddleware(userRepository);

// Exportamos o tipo das chaves para o TypeScript usar como contrato
export type SecurityLevel = 'PUBLIC' | 'REQUIRE_AUTH' | 'REQUIRE_AUTH_AUTHORIZED_DEVICE' | 'REQUIRE_PRE_AUTH' | 'REQUIRE_STORE' | 'REQUIRE_ACTIVE_SUBSCRIPTION';

export const TenantGates: Record<SecurityLevel, RequestHandler[]> = {
    PUBLIC: [],
    REQUIRE_PRE_AUTH: [
        preAuthMiddleware
    ],
    REQUIRE_AUTH: [
        authMiddleware
    ],
    REQUIRE_AUTH_AUTHORIZED_DEVICE:[
        authMiddleware,
        ensureDeviceIsAuthorizedMiddleware
    ],
    REQUIRE_STORE: [
        authMiddleware,
        ensureDeviceIsAuthorizedMiddleware,
        ensureStoreSelectedMiddleware
    ],
    REQUIRE_ACTIVE_SUBSCRIPTION: [
        authMiddleware,
        ensureDeviceIsAuthorizedMiddleware, 
        ensureStoreSelectedMiddleware, 
        ensureSubscriptionActiveMiddleware
    ]
};