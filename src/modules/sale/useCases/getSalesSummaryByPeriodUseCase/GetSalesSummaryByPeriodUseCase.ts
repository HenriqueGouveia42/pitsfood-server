import  type { ISaleRepository, SalesReportDTO } from "../../repositories/sale.repository.interface.js"
import { Sale } from "../../entities/sale.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { Decimal } from "decimal.js"

interface IGetSalesSummaryByPeriodRequestDTO {
  startDate: Date;
  endDate: Date;
}

export class GetSalesSummaryByPeriodUseCase {

    constructor(
        private saleRepository: ISaleRepository
    ){}

    async execute({ startDate, endDate }: IGetSalesSummaryByPeriodRequestDTO): Promise<SalesReportDTO>{

        if (startDate > endDate){
            throw new AppError("A data iniciial não pode ser maior que a data final", 400, "INVALID_DATES")
        }

        const report = await this.saleRepository.getSalesSummaryByPeriod(startDate, endDate);

        return report;

    }
}