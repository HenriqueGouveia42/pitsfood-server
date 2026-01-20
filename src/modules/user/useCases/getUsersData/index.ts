import { GetUsersDataUseCase } from "./GetUsersDataUseCase.js";
import { GetUsersDataController } from "./GetUsersDataController.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();

const getUsersDataUseCase: GetUsersDataUseCase = new GetUsersDataUseCase(userRepository);

const getUsersDataController: GetUsersDataController = new GetUsersDataController(getUsersDataUseCase);

export { getUsersDataController }