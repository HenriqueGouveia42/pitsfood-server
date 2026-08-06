import { PrismaUnitOfWork } from "../../../../shared/infra/uow/implementations/PrismaUnitOfWork.js";
import { BatchAddItemsUseCase } from "./BatchAddItemsUseCase.js";
import { BatchAddItemsController } from "./BatchAddItemsController.js";

// 1. Instancia a Infraestrutura (A fábrica que controla o banco de dados)
const prismaUnitOfWork: PrismaUnitOfWork = new PrismaUnitOfWork();

// 2. Instancia o UseCase da borda (Injetando apenas o Serviço)
const batchAddItemsUseCase: BatchAddItemsUseCase = new BatchAddItemsUseCase(
    prismaUnitOfWork
);

// 3. Instancia o Controller (Fronteira HTTP)
const batchAddItemsController: BatchAddItemsController = new BatchAddItemsController(batchAddItemsUseCase);

export { batchAddItemsController };