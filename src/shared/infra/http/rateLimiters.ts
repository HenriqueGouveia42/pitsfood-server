import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../redis/index.js';

const createRedisStore = (prefix: string) => new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: prefix
});

// 1. ROTAS PÚBLICAS
export const publicRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 60, 
    standardHeaders: true, 
    legacyHeaders: false,
    store: createRedisStore('rl:public:'),
    keyGenerator: (req) => {
        // Envelopamos o IP com o helper da biblioteca para mascarar IPv6
        const ip = (req.ip || req.socket.remoteAddress) as string;
        return ipKeyGenerator(ip); 
    },
    message: { error: "Muitas requisições deste IP. Tente novamente em alguns instantes." }
});

// 2. ROTAS DE USUÁRIO AUTENTICADO
export const authRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 150, 
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('rl:auth:'),
    keyGenerator: (req) => {
        if (req.user?.id) {
            return `user:${req.user.id}`;
        }
        
        // Fallback seguro com máscara IPv6
        const ip = (req.ip || req.socket.remoteAddress) as string;
        return ipKeyGenerator(ip);
    },
    message: { error: "Limite de requisições excedido para o seu usuário." }
});

// 3. ROTAS DE LOJA
export const tenantRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 300, 
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('rl:tenant:'),
    keyGenerator: (req) => {
        if (req.user?.id && req.user?.store_id) {
            return `store:${req.user.store_id}:user:${req.user.id}`;
        }
        
        if (req.user?.id) {
            return `user:${req.user.id}`;
        }

        // Fallback seguro com máscara IPv6
        const ip = (req.ip || req.socket.remoteAddress) as string;
        return ipKeyGenerator(ip);
    },
    message: { error: "Limite de requisições excedido para o seu usuário nesta loja." }
});