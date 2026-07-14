import { UpdateUserNameController } from "./UpdateUserNameController.js";
import { UpdateUserNameUseCase } from "./UpdateUserNameUseCase.js";

import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const updateUserNameUseCase: UpdateUserNameUseCase = new UpdateUserNameUseCase(
    userRepository,
    storeRepository,
    cacheProvider
)

const updateUserNameController: UpdateUserNameController = new UpdateUserNameController(
    updateUserNameUseCase
);

export { updateUserNameController }