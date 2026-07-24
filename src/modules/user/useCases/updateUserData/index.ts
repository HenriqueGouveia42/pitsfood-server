import { UpdateUserDataController } from "./UpdateUserDataController.js";
import { UpdateUserDataUseCase } from "./UpdateUserDataUseCase.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/cacheProvider/RedisCacheProvider.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const updateUserDataUseCase: UpdateUserDataUseCase = new UpdateUserDataUseCase(userRepository, storeRepository, cacheProvider);

const updateUserDataController: UpdateUserDataController = new UpdateUserDataController(updateUserDataUseCase);

export { updateUserDataController }

