import { redisClient } from "../../../infra/redis/index.js";
import type { ICacheProvider } from "../models/ICacheProvider.js";

export class RedisCacheProvider implements ICacheProvider {
    
    async save(key: string, value: string, expireInSeconds?: number): Promise<void> {
        
        if (expireInSeconds) {
            await redisClient.set(key, value, {
                EX: expireInSeconds
            });
        } else {
            await redisClient.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return await redisClient.get(key);
    }

    async invalidate(key: string): Promise<void> {
        await redisClient.del(key);
    }
}