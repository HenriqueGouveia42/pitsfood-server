import { Queue, type JobsOptions } from "bullmq";
import type { IQueueProvider, IQueueOptions } from "../models/IQueueProvider.js";
import { queueRedisConnection } from "../../../infra/redis/queueConnection.js";

export class BullMQQueueProvider implements IQueueProvider {
    private queues: Map<string, Queue> = new Map();

    private getQueue(queueName: string): Queue {
        if (!this.queues.has(queueName)) {
            const newQueue = new Queue(queueName, { 
                connection: queueRedisConnection 
            });
            this.queues.set(queueName, newQueue);
        }
        return this.queues.get(queueName)!;
    }

    public async addJob<T>(queueName: string, jobName: string, data: T, opts?: IQueueOptions): Promise<string> {
        const queue = this.getQueue(queueName);
        
        // Inicializa as opções como undefined
        let bullMQOptions: JobsOptions | undefined = undefined;

        // Monta o objeto de opções condicionalmente para respeitar o exactOptionalPropertyTypes
        if (opts) {
            bullMQOptions = {};
            
            if (opts.jobId !== undefined) {
                bullMQOptions.jobId = opts.jobId;
            }
        }

        const job = await queue.add(jobName, data, bullMQOptions);
        
        if (!job.id) {
            throw new Error("Falha ao gerar o ID do Job na fila.");
        }

        return job.id;
    }

    async getJobState(queueName: string, jobId: string): Promise<string | null> {
        const queue = this.queues.get(queueName);
        if (!queue) return null;

        const job = await queue.getJob(jobId);
        if (!job) return null;

        // Retorna: 'waiting', 'active', 'completed', 'failed', 'delayed'
        const state = await job.getState(); 
        return state;
    }

    async removeJob(queueName: string, jobId: string): Promise<void> {
        const queue = this.queues.get(queueName);
        if (!queue) return;

        const job = await queue.getJob(jobId);
        if (job) {
            await job.remove();
        }
    }
}