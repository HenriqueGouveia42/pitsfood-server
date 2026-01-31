import { MakeStockEntryController } from "./MakeStockEntryController.js";
import { MakeStockEntryUseCase } from "./MakeStockEntryUseCase.js";

import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaProductRepository } from "../../repositories/implementations/prisma/product.repository.prisma.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const productRepository: PrismaProductRepository = new PrismaProductRepository();

const makeStockEntryUseCase: MakeStockEntryUseCase = new MakeStockEntryUseCase(userRepository, storeRepository, productRepository);

const makeStockEntryController: MakeStockEntryController = new MakeStockEntryController(makeStockEntryUseCase);

export { makeStockEntryController }