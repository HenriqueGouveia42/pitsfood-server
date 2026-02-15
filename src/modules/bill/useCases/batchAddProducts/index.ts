import { PrismaBillRepository } from "../../repositories/implementations/prisma/bill.repository.prisma.js";
import { PrismaProductRepository } from "../../../product/repositories/implementations/prisma/product.repository.prisma.js";

import { BatchAddItemsUseCase } from "./batchAddItemsUseCase.js";
import { BatchAddItemsController } from "./batchAddItemsController.js";

const billRepository = new PrismaBillRepository();
const productRepository = new PrismaProductRepository();

const batchAddItemsUseCase = new BatchAddItemsUseCase(
    billRepository,
    productRepository,
);

const batchAddItemsController = new BatchAddItemsController(batchAddItemsUseCase)

export { batchAddItemsController }
