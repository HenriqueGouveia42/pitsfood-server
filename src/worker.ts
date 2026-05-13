import { Worker } from 'bullmq';
import { queueRedisConnection } from './shared/infra/redis/queueConnection.js';
import { processSalesSummaryJob } from './modules/sale/infra/jobs/ProcessSalesSummaryJob.js';

console.log('Iniciando Background Workers...');

// Cria o Worker escutando a fila "reportsQueue"
const reportsWorker = new Worker(
    'reportsQueue', 
    // Essa função roteia o Job para o arquivo correto baseado no nome da tarefa
    async (job) => {
        switch (job.name) {
            case 'generate-sales-summary':
                return await processSalesSummaryJob(job);
            // No futuro:
            // case 'generate-inventory-report':
            //     return await processInventoryJob(job);
            default:
                throw new Error(`Tipo de job desconhecido: ${job.name}`);
        }
    }, 
    {
        connection: queueRedisConnection,
        concurrency: 5 
    }
);

reportsWorker.on('completed', job => {
    console.log(`SUCESSO: Fila: Tarefa ${job.name} (ID: ${job.id}) finalizada!`);
});

reportsWorker.on('failed', (job, err) => {
    console.error(`FALHA: Fila: Tarefa ${job?.name} falhou:`, err.message);
});