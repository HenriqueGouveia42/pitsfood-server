import { ListMyStoresController } from "./ListMyStoresController.js";
import { ListMyStoresUseCase } from "./ListMyStoresUseCase.js";
import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();

const listMyStoresUseCase: ListMyStoresUseCase = new ListMyStoresUseCase(storeRepository);

const listMyStoresController: ListMyStoresController = new ListMyStoresController(listMyStoresUseCase);

export { listMyStoresController }