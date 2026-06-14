import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL; // ex: 'redis://localhost:6379'

// client Padrão - get/set de cache
const redisClient = createClient({ url: redisUrl });

// client publicador
const redisPublisher = redisClient.duplicate();

// client ouvinte
const redisSubscriber = redisClient.duplicate();

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisPublisher.on('error', (err) => console.log('Redis Publisher Error', err));
redisSubscriber.on('error', (err) => console.log('Redis Subscriber Error', err));

// conecta todas as instâncias ao iniciar a aplicação
await Promise.all([
    redisClient.connect(),
    redisPublisher.connect(),
    redisSubscriber.connect()
]);

console.log(`Redis (Cache, Pub e Sub) conectado com sucesso! Rodando em ${redisUrl || 'localhost:6379'}`);

export { redisClient, redisPublisher, redisSubscriber };