// Criamos uma interface genérica para não acoplar com as tipagens específicas do BullMQ
export interface IQueueOptions {
    jobId?: string;
    // No futuro pode-se adicionar mais coisas aqui:
    // delay?: number;
    // attempts?: number;
}

export interface IQueueProvider {
    addJob<T>(queueName: string, jobName: string, data: T, opts?: IQueueOptions): Promise<string>;
    getJobState(queueName: string, jobId: string): Promise<string | null>;
    removeJob(queueName: string, jobId: string): Promise<void>;
}

