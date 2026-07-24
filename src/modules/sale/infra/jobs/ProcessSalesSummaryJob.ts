import type { Job } from 'bullmq';
import { PrismaSaleRepository } from '../../repositories/implementations/prisma/sale.repository.prisma.js';
import { RedisCacheProvider } from '../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js';
import type { SalesReportDTO } from '../../repositories/interfaces/sale.repository.interface.js';

// Instanciamos as dependências que o Worker vai precisar
// (Como o worker roda em background, podemos instanciar diretamente ou usar seu container de injeção)
const saleRepository = new PrismaSaleRepository();
const cacheProvider = new RedisCacheProvider();

export async function processSalesSummaryJob(job: Job) {
    //console.log(`[Worker] Iniciando processamento do Job ${job.id}...`);

    // 1. Extraímos os dados que a API mandou "na caixa"
    const { startDate, endDate, store_id, cache_key, cache_time_in_seconds } = job.data;

    // As datas voltam da fila como strings ISO, precisamos converter de volta para Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
        // 2. O TRABALHO PESADO: Vai no PostgreSQL fazer os agrupamentos
        const report: SalesReportDTO = await saleRepository.getSalesSummaryByPeriod(start, end, store_id);

        // 3. SALVA NO CACHE: Disponibiliza para a API (que está sendo "pollada" pelo front)
        await cacheProvider.save(cache_key, report, cache_time_in_seconds);

        //console.log(`[Worker] Job ${job.id} concluído com sucesso! Salvo no cache.`);
        
        return report; // O BullMQ marca a tarefa como concluída
        
    } catch (error) {
        console.error(`[Worker] Erro catastrófico no Job ${job.id}:`, error);
        throw error; // Repassa o erro para o BullMQ lidar com retentativas (se houver)
    }
}