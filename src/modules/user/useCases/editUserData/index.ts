import { UpdateUserDataController } from "./UpdateUserDataController.js";
import { UpdateUserDataUseCase } from "./UpdateUserDataUseCase.ts.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();

const updateUserDataUseCase: UpdateUserDataUseCase = new UpdateUserDataUseCase(userRepository);

const updateUserDataController: UpdateUserDataController = new UpdateUserDataController(updateUserDataUseCase);

export { updateUserDataController }

