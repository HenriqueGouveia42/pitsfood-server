import { UpdateUserStatusController } from "./UpdateUserStatusController.js";
import { UpdateUserStatusUseCase } from "./UpdateUserStatusUseCase.js";

import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const updateUserStatusUseCase: UpdateUserStatusUseCase = new UpdateUserStatusUseCase(
    userRepository,
    storeRepository,
    cacheProvider
)

const updateUserStatusController: UpdateUserStatusController = new UpdateUserStatusController(
    updateUserStatusUseCase
);

export { updateUserStatusController }