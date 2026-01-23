import { CreateNewStoreController } from "./CreateNewStoreController.js";
import { CreateNewStoreUseCase } from "./CreateNewStoreUsecase.js";
import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js"

const prismaStoreRepository: PrismaStoreRepository = new PrismaStoreRepository();
const createNewStoreUseCase: CreateNewStoreUseCase = new CreateNewStoreUseCase(prismaStoreRepository);
const createNewStoreController: CreateNewStoreController = new CreateNewStoreController(createNewStoreUseCase);

export { createNewStoreController }