import { LogoutController } from "./logoutController.js";
import { LogoutUseCase } from "./LogoutUseCase.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const logoutUseCase: LogoutUseCase = new LogoutUseCase(userRepository);

const logoutController: LogoutController = new LogoutController(logoutUseCase);

export { logoutController }