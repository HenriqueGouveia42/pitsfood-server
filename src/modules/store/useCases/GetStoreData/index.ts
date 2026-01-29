import { GetStoreDataController } from "./GetStoreDataController.js";
import { GetStoreDataUseCase } from "./GetStoreDataUseCase.js";
import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js"

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const getStoreDataUseCase: GetStoreDataUseCase = new GetStoreDataUseCase(storeRepository, userRepository, cacheProvider);
const getStoreDataController: GetStoreDataController = new GetStoreDataController(getStoreDataUseCase);

export { getStoreDataController }