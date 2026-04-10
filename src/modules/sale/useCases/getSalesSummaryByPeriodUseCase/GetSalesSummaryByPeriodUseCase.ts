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

        const start_day: string = startDate.getDate().toString();
        const start_month: string = startDate.getMonth().toString();
        const start_year: string = startDate.getFullYear().toString();
        const start_day_month_year: string = `${start_day}_${start_month}_${start_year}`

        const end_day: string = endDate.getDate().toString();
        const end_month: string = endDate.getMonth().toString();
        const end_year: string = endDate.getFullYear().toString();
        const end_day_month_year: string = `${end_day}_${end_month}_${end_year}`

        const cache_key: string = CacheKeys.Sale.SUMMARY_BY_PERIOD(
            store_id,
            start_day_month_year,
            end_day_month_year
        )

        const cachedData = await this.cacheProvider.get<SalesReportDTO>(cache_key);

        if (cachedData) return cachedData;

        //cache miss

        const report: SalesReportDTO = await this.saleRepository.getSalesSummaryByPeriod(startDate, endDate);

        await this.cacheProvider.save(cache_key, report, 3600 * 24); //1 dia 

        return report;

    }
}