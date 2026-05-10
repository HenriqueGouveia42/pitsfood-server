import { FetchSalesSummaryByPeriodController } from "./FetchSalesSummaryByPeriodController.js";
import { FetchSalesSummaryByPeriodUseCase } from "./FetchSalesSummaryByPeriodUseCase.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";
import { BullMQQueueProvider } from "../../../../shared/providers/QueueProvider/implementations/BullMQQueueProvider.js";

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