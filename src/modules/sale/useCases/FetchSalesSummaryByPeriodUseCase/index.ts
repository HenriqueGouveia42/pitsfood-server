import { FetchSalesSummaryByPeriodController } from "./FetchSalesSummaryByPeriodController.js";
import { FetchSalesSummaryByPeriodUseCase } from "./FetchSalesSummaryByPeriodUseCase.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import { BullMQQueueProvider } from "../../../../shared/infra/providers/implementations/queueProvider/BullMQQueueProvider.js";

const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();
const bullMqqProvider: BullMQQueueProvider = new BullMQQueueProvider();

const fetchSalesSummaryByPeriodUseCase: FetchSalesSummaryByPeriodUseCase
    = new FetchSalesSummaryByPeriodUseCase(
        redisCacheProvider,
        bullMqqProvider
    )
;
const fetchSalesSummaryByPeriodController: FetchSalesSummaryByPeriodController 
    = new FetchSalesSummaryByPeriodController(
        fetchSalesSummaryByPeriodUseCase
);

export { fetchSalesSummaryByPeriodController }