import { IsLoggedInController } from "./isLoggedInController.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();

const isLoggedInController = new IsLoggedInController(userRepository)

export { isLoggedInController }