import { ProcessOverdueSubscriptionsUseCase } from "./ProcessOverdueSubscriptionsUseCase.js";

import { PrismaStoreRepository } from "../../../repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();

const processOverdueSubscriptionsUseCase: ProcessOverdueSubscriptionsUseCase = new ProcessOverdueSubscriptionsUseCase(storeRepository, redisCacheProvider);

export { processOverdueSubscriptionsUseCase }