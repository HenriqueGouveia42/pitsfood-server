import { PrismaUnitOfWork } from "../../../../shared/infra/uow/implementations/PrismaUnitOfWork.js";
import { BillAdditionService } from "../../services/BillAdditionService.js";
import { BatchAddItemsUseCase } from "./batchAddItemsUseCase.js";
import { BatchAddItemsController } from "./batchAddItemsController.js";

// 1. Instancia a Infraestrutura (A fábrica que controla o banco de dados)
const prismaUnitOfWork: PrismaUnitOfWork = new PrismaUnitOfWork();

// 2. Instancia o Serviço de Aplicação Orquestrador (Injetando o UoW)
const billAdditionService: BillAdditionService = new BillAdditionService(prismaUnitOfWork);

// 3. Instancia o UseCase da borda (Injetando apenas o Serviço)
const batchAddItemsUseCase: BatchAddItemsUseCase = new BatchAddItemsUseCase(billAdditionService);

// 4. Instancia o Controller (Fronteira HTTP)
const batchAddItemsController: BatchAddItemsController = new BatchAddItemsController(batchAddItemsUseCase);

export { batchAddItemsController };