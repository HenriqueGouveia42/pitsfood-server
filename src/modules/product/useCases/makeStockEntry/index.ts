import { MakeStockEntryController } from "./MakeStockEntryController.js";
import { MakeStockEntryUseCase } from "./MakeStockEntryUseCase.js";

import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

import { PrismaUnitOfWork } from "../../../../shared/infra/uow/implementations/PrismaUnitOfWork.js";
import { AddStockEntryService } from "../../services/AddStockEntryService.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();

const prismaUnitOfWork: PrismaUnitOfWork = new PrismaUnitOfWork();
const addStockEntryService: AddStockEntryService = new AddStockEntryService(prismaUnitOfWork);

const makeStockEntryUseCase: MakeStockEntryUseCase = new MakeStockEntryUseCase(
    userRepository,
    storeRepository,
    addStockEntryService, // O PrismaProductRepository solto sai, o Service entra
    redisCacheProvider
);

const makeStockEntryController = new MakeStockEntryController(makeStockEntryUseCase);

export { makeStockEntryController };