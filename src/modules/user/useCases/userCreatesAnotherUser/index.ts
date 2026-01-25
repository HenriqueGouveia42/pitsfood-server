import { UserCreatesAnotherUserUseCase } from "./UserCreatesAnotherUserUseCase.js";
import  { UserCreatesAnotherUserController } from "./UserCreatesAnotherUserController.js"
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();

const userCreatesAnotherUserUseCase: UserCreatesAnotherUserUseCase = new UserCreatesAnotherUserUseCase(userRepository)

const userCreatesAnotherUserController: UserCreatesAnotherUserController = new UserCreatesAnotherUserController(userCreatesAnotherUserUseCase)

export { userCreatesAnotherUserController }