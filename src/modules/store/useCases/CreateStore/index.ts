import { CreateStoreController } from "./CreateStoreController.js";
import { CreateStoreUseCase } from "./CreateStoreUseCase.js";
import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();

const createStoreUseCase: CreateStoreUseCase = new CreateStoreUseCase(storeRepository, userRepository);
const createStoreController: CreateStoreController = new CreateStoreController(createStoreUseCase);

export { createStoreController }