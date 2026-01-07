import { PrismaBillRepository } from "../../repositories/implementations/prisma/bill.repository.prisma.js";
import { PrismaProductRepository } from "../../../product/repositories/implementations/prisma/product.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";

import { BatchAddItemsUseCase } from "./batchAddItemsUseCase.js";
import { BatchAddItemsController } from "./batchAddItemsController.js";

const billRepository = new PrismaBillRepository();
const productRepository = new PrismaProductRepository();
const userRepository = new PrismaUserRepository();

//injetamos os repositorios que serao usados
const batchAddItemsUseCase = new BatchAddItemsUseCase(
    billRepository,
    productRepository,
    userRepository
);

const batchAddItemsController = new BatchAddItemsController(batchAddItemsUseCase)

export { batchAddItemsController }
