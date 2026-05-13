import { Redis } from "ioredis";

// O BullMQ precisa de uma instância pura do IORedis
const queueRedisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Obrigatório para o BullMQ não conflitar com a reconexão automática
});

queueRedisConnection.on('error', (err) => console.error('Fila Redis Client Error:', err));
queueRedisConnection.on('connect', () => console.log('Redis (Fila/BullMQ) conectado com sucesso!'));

export { queueRedisConnection };