import { CreateStoreController } from "./CreateStoreController.js";
import { CreateStoreUseCase } from "./CreateStoreUseCase.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaUnitOfWork } from "../../../../shared/infra/uow/implementations/PrismaUnitOfWork.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const prismaUnitOfWork: PrismaUnitOfWork = new PrismaUnitOfWork();

const createStoreUseCase: CreateStoreUseCase = new CreateStoreUseCase(storeRepository, userRepository, prismaUnitOfWork);
const createStoreController: CreateStoreController = new CreateStoreController(createStoreUseCase);

export { createStoreController }