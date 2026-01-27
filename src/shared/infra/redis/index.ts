import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL // ex: 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Conecta ao iniciar a aplicação
await redisClient.connect();

console.log(`Redis conectado com sucesso! Rodando em ${process.env.REDIS_URL || 'localhost:6379'}`);

export { redisClient };