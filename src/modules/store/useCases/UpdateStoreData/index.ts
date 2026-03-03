import { UpdateStoreDataController } from "./UpdateStoreDataController.js";
import { UpdateStoreDataUseCase } from "./UpdateStoreDataUseCase.js";

import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const redisProvider: RedisCacheProvider = new RedisCacheProvider();

const updateStoreDataUseCase: UpdateStoreDataUseCase = new UpdateStoreDataUseCase(storeRepository, redisProvider);

const updateStoreDataController: UpdateStoreDataController = new UpdateStoreDataController(updateStoreDataUseCase);

export { updateStoreDataController }