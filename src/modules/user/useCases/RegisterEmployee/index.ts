import { RegisterEmployeeUseCase } from "./RegisterEmployeeUseCase.js";
import  { RegisterEmployeeController } from "./RegisterEmployeeController.js"
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();

const registerEmployeeUseCase: RegisterEmployeeUseCase = new RegisterEmployeeUseCase(userRepository, storeRepository);

const registerEmployeeController: RegisterEmployeeController = new RegisterEmployeeController(registerEmployeeUseCase);

export { registerEmployeeController }

