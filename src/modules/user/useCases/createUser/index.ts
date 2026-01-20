import { CreateUserUseCase } from "./CreateUserUseCase.js";
import  { CreateUserController } from "./CreateUserController.js"
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();

const createUserUseCase: CreateUserUseCase = new CreateUserUseCase(userRepository)

const createUserController: CreateUserController = new CreateUserController(createUserUseCase)

export { createUserController }