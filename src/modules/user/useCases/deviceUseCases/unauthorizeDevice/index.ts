import { UnauthorizeDeviceController } from "./UnauthorizeDeviceController.js";
import { UnauthorizeDeviceUseCase } from "./UnauthorizeDeviceUseCase.js";

import { PrismaUserRepository } from "../../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const unauthorizeDeviceUseCase: UnauthorizeDeviceUseCase = new UnauthorizeDeviceUseCase(
    userRepository,
    storeRepository,
    cacheProvider
);

const unauthorizeDeviceController: UnauthorizeDeviceController = new UnauthorizeDeviceController(
    unauthorizeDeviceUseCase
);

export { unauthorizeDeviceController }