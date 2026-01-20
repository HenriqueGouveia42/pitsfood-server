import { GetSalesSummaryByPeriodController } from "./GetSalesSummaryByPeriodController.js";
import { GetSalesSummaryByPeriodUseCase } from "./GetSalesSummaryByPeriodUseCase.js";
import { PrismaSaleRepository } from "../../repositories/implementations/prisma/sale.repository.prisma.js";

const saleRepository: PrismaSaleRepository = new PrismaSaleRepository();
const getSalesSummaryByPeriodUseCase: GetSalesSummaryByPeriodUseCase = new GetSalesSummaryByPeriodUseCase(saleRepository);
const getSalesSummaryByPeriodController: GetSalesSummaryByPeriodController = new GetSalesSummaryByPeriodController(getSalesSummaryByPeriodUseCase);

export { getSalesSummaryByPeriodController }