import { Worker } from 'bullmq';
import { queueRedisConnection } from './shared/infra/redis/queueConnection.js';
import { processSalesSummaryJob } from './modules/sale/infra/jobs/ProcessSalesSummaryJob.js';

import { startCronJobs } from './shared/infra/jobs/cron.js';

console.log('Iniciando Background Workers...');

startCronJobs();

const reportsWorker = new Worker(
    'reportsQueue', 
    async (job) => {
        switch (job.name) {
            case 'generate-sales-summary':
                return await processSalesSummaryJob(job);
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