import { redisClient } from "../../../infra/redis/index.js";
import type { ICacheProvider } from "../models/ICacheProvider.js";

export class RedisCacheProvider implements ICacheProvider {
    
    //value agora é 'any' porque vamos receber Objetos/Arrays, não só strings
    public async save(key: string, value: any, expireInSeconds?: number): Promise<void> {
        
        //redis não entende objetos JS. Precisamos virar String (JSON)
        const stringValue = JSON.stringify(value);

        if (expireInSeconds) {
            await redisClient.set(key, stringValue, {
                EX: expireInSeconds
            });
        } else {
            await redisClient.set(key, stringValue);
        }
    }

    //<T> para dizer ao TS: "Vou retornar o tipo que você me pediu"
    public async get<T>(key: string): Promise<T | null> {
        const data = await redisClient.get(key);

        if (!data) {
            return null;
        }

        //transformar a string do Redis de volta em Objeto T
        const parsedData = JSON.parse(data) as T;

        return parsedData;
    }

    public async invalidate(key: string): Promise<void> {
        await redisClient.del(key);
    }
}