import { AppError } from "../../../../shared/errors/AppError.js";
import type { IQueueProvider } from "../../../../shared/providers/QueueProvider/models/IQueueProvider.js";

interface IRequest {
    startDate: Date;
    endDate: Date;
    store_id: string;
}

interface IResponse {
    jobId: string;
}

export class RequestSalesSummaryUseCase {
    constructor(
        private queueProvider: IQueueProvider
    ) {}

    async execute({ startDate, endDate, store_id }: IRequest): Promise<IResponse> {
        
        if (startDate > endDate) {
            throw new AppError("A data inicial não pode ser maior que a data final", 400, "INVALID_DATES");
        }

        // Enfileira a tarefa. O QueueProvider vai usar o BullMQ por baixo dos panos.
        // Passamos as datas e o store_id que o Worker precisará para executar a query.
        const jobId: string = await this.queueProvider.addJob(
            "reportsQueue",             // Nome da Fila
            "generate-sales-summary",   // Nome da Tarefa (Job)
            { startDate, endDate, store_id } // Payload
        );

        return { jobId };
    }
}