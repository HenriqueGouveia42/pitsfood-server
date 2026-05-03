import type { ISaleRepository, SalesReportDTO } from "../../repositories/interfaces/sale.repository.interface.js";
import { Sale } from "../../entities/sale.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { Decimal } from "decimal.js"
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";

interface IGetSalesSummaryByPeriodRequestDTO {
  startDate: Date;
  endDate: Date;
  store_id: string
}

export class GetSalesSummaryByPeriodUseCase {

    constructor(
        private saleRepository: ISaleRepository,
        private cacheProvider: ICacheProvider
    ){}

    async execute({ startDate, endDate, store_id }: IGetSalesSummaryByPeriodRequestDTO): Promise<SalesReportDTO>{

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

        if (
           diffInMs <= ONE_DAY_IN_MS
        ){
            cache_time_in_seconds = 5 * 60
        } else{
            cache_time_in_seconds = 15 * 60
        }
    
        const cachedData: SalesReportDTO | null = await this.cacheProvider.get<SalesReportDTO>(cache_key);

        if (cachedData){
            console.log(start_day, end_day, cache_time_in_seconds)
            return cachedData;

        } 

        //cache miss

        const report: SalesReportDTO = await this.saleRepository.getSalesSummaryByPeriod(startDate, endDate, store_id);

        console.log(start_day, end_day, cache_time_in_seconds)
        await this.cacheProvider.save(cache_key, report, cache_time_in_seconds);

        return report;

    }
}