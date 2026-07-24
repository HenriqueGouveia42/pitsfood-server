import { UpdateUserPasswordController } from "./UpdateUserPasswordController.js";
import { UpdateUserPasswordUseCase } from "./UpdateUserPasswordUsecase.js";

import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const updateUserPasswordCUseCase: UpdateUserPasswordUseCase = new UpdateUserPasswordUseCase(
    userRepository,
    storeRepository,
    cacheProvider
);

const updateUserPasswordController: UpdateUserPasswordController = new UpdateUserPasswordController(
    updateUserPasswordCUseCase
);

export { updateUserPasswordController }