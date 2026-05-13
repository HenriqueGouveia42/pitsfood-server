import { UpdateStoreIconController } from "./UpdateStoreIconController.js";
import { UpdateStoreIconUseCase } from "./UpdateStoreIconUseCase.js";

import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { S3StorageProvider } from "../../../../shared/providers/StorageProvider/implementations/S3StorageProvider.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const storageProvider: S3StorageProvider = new S3StorageProvider();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const updateStoreIconUseCase: UpdateStoreIconUseCase = new UpdateStoreIconUseCase(storeRepository, storageProvider, cacheProvider);
const updateStoreIconController: UpdateStoreIconController = new UpdateStoreIconController(updateStoreIconUseCase);

export { updateStoreIconController }