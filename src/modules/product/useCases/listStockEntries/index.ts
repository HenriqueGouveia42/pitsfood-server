import { ListStockEntriesController } from "./ListStockEntiriesController.js";
import { ListStockEntriesUseCase } from "./ListStockEntriesUseCase.js";
import { PrismaStockEntryRepository } from "../../repositories/implementations/prisma/stock-entry.repository.prisma.js";

const stockEntriesRepository: PrismaStockEntryRepository = new PrismaStockEntryRepository;
const listStockEntriesUseCase: ListStockEntriesUseCase = new ListStockEntriesUseCase(stockEntriesRepository)

const listStockEntriesController: ListStockEntriesController = new ListStockEntriesController(listStockEntriesUseCase);

export { listStockEntriesController }