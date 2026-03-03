import { GetUsersDataUseCase } from "./GetUsersDataUseCase.js";
import { GetUsersDataController } from "./GetUsersDataController.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();

const getUsersDataUseCase: GetUsersDataUseCase = new GetUsersDataUseCase(userRepository, redisCacheProvider);

const getUsersDataController: GetUsersDataController = new GetUsersDataController(getUsersDataUseCase);

export { getUsersDataController }