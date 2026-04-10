import { GetSalesSummaryByPeriodController } from "./GetSalesSummaryByPeriodController.js";
import { GetSalesSummaryByPeriodUseCase } from "./GetSalesSummaryByPeriodUseCase.js";
import { PrismaSaleRepository } from "../../repositories/implementations/prisma/sale.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

const redisCacheProvicer: RedisCacheProvider = new RedisCacheProvider();
const saleRepository: PrismaSaleRepository = new PrismaSaleRepository();
const getSalesSummaryByPeriodUseCase: GetSalesSummaryByPeriodUseCase = new GetSalesSummaryByPeriodUseCase(saleRepository, redisCacheProvicer);
const getSalesSummaryByPeriodController: GetSalesSummaryByPeriodController = new GetSalesSummaryByPeriodController(getSalesSummaryByPeriodUseCase);

export { getSalesSummaryByPeriodController }