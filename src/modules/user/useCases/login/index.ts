import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { LoginUseCase } from "./loginUseCase.js";
import { LoginController } from "./loginController.js";

const userRepository = new PrismaUserRepository();

const loginUseCase = new LoginUseCase(userRepository);

const loginController = new LoginController(loginUseCase)

export {loginController}