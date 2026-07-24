import { UpdateStoreIconController } from "./UpdateStoreIconController.js";
import { UpdateStoreIconUseCase } from "./UpdateStoreIconUseCase.js";

import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { S3StorageProvider } from "../../../../shared/infra/providers/implementations/storageProvider/S3StorageProvider.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const storageProvider: S3StorageProvider = new S3StorageProvider();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const updateStoreIconUseCase: UpdateStoreIconUseCase = new UpdateStoreIconUseCase(storeRepository, storageProvider, cacheProvider);
const updateStoreIconController: UpdateStoreIconController = new UpdateStoreIconController(updateStoreIconUseCase);

export { updateStoreIconController }