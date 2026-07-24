import type { SalesReportDTO } from "../../repositories/interfaces/sale.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import type { IQueueProvider } from "../../../../shared/providers/interfaces/queueProvider/IQueueProvider.js";

interface IFetchSalesSummaryByPeriodRequestDTO {
  startDate: Date;
  endDate: Date;
  store_id: string
}

interface IFetchSalesSummaryByPeriodResponseDTO {
    status: "processing" | "completed" | "failed",
    jobId?: string;
    data?: SalesReportDTO;
    message?: string
}

export class FetchSalesSummaryByPeriodUseCase {

    constructor(
        private cacheProvider: ICacheProvider,
        private queueProvider: IQueueProvider
    ){}

    async execute({ startDate, endDate, store_id }: IFetchSalesSummaryByPeriodRequestDTO): Promise<IFetchSalesSummaryByPeriodResponseDTO>{

        if (startDate > endDate){
            throw new AppError("A data inicial não pode ser maior que a data final", 400, "INVALID_DATES")
        }

        const start_day: string = startDate.getUTCDate().toString();
        const start_month: string = startDate.getUTCMonth().toString();
        const start_year: string = startDate.getUTCFullYear().toString();
        const start_day_month_year: string = `${start_day}_${start_month}_${start_year}`;
        
        const cacheEndDate = new Date(endDate.getTime() - 1);

        const end_day: string = cacheEndDate.getUTCDate().toString();
        const end_month: string = cacheEndDate.getUTCMonth().toString();
        const end_year: string = cacheEndDate.getUTCFullYear().toString();
        const end_day_month_year: string = `${end_day}_${end_month}_${end_year}`;

        const cache_key: string = CacheKeys.Sale.SUMMARY_BY_PERIOD(
            store_id,
            start_day_month_year,
            end_day_month_year
        )

        const diffInMs = endDate.getTime() - startDate.getTime();
        const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

        let cache_time_in_seconds: number;

        if (diffInMs <= ONE_DAY_IN_MS){
            cache_time_in_seconds = 5 * 60
        } else{
            cache_time_in_seconds = 15 * 60
        }
    
        const cachedData: SalesReportDTO | null = await this.cacheProvider.get<SalesReportDTO>(cache_key);

        if (cachedData){
            return {
                status: "completed",
                data: cachedData
            };
        } 

        // 2. SE NÃO TEM CACHE, VERIFICA O STATUS DO JOB NA FILA

        const jobState = await this.queueProvider.getJobState("reportsQueue", cache_key);

        if (jobState === 'waiting' || jobState === 'active' || jobState === 'delayed'){
            return { status: "processing", jobId: cache_key }
        }

        if (jobState === "failed"){
            await this.queueProvider.removeJob("reportsQueue", cache_key);

            return { 
                status: 'failed', 
                message: "A geração do relatório falhou na última tentativa. Tente novamente." 
            };
        }

        if (jobState === "completed"){
            await this.queueProvider.removeJob("reportsQueue", cache_key);
        }

        const jobId: string = await this.queueProvider.addJob(
            "reportsQueue",
            "generate-sales-summary",
            { 
                startDate, 
                endDate, 
                store_id, 
                cache_key,              
                cache_time_in_seconds
            },
            { jobId: cache_key }
        );

        return { status: "processing", jobId };
    }
}