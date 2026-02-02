import { ListStockEntriesController } from "./ListStockEntiriesController.js";
import { ListStockEntriesUseCase } from "./ListStockEntriesUseCase.js";
import { PrismaProductRepository } from "../../repositories/implementations/prisma/product.repository.prisma.js";

const productRepository: PrismaProductRepository = new PrismaProductRepository();
const listStockEntriesUseCase: ListStockEntriesUseCase = new ListStockEntriesUseCase(productRepository);

const listStockEntriesController: ListStockEntriesController = new ListStockEntriesController(listStockEntriesUseCase);

export { listStockEntriesController }