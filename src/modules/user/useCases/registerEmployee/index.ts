import { RegisterEmployeeUseCase } from "./RegisterEmployeeUseCase.js";
import  { RegisterEmployeeController } from "./RegisterEmployeeController.js"
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const cacheRedisProvider: RedisCacheProvider = new RedisCacheProvider();

const registerEmployeeUseCase: RegisterEmployeeUseCase = new RegisterEmployeeUseCase(userRepository, storeRepository, cacheRedisProvider);

const registerEmployeeController: RegisterEmployeeController = new RegisterEmployeeController(registerEmployeeUseCase);

export { registerEmployeeController }

