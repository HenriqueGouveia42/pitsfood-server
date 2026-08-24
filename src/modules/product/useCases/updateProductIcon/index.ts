import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import { S3StorageProvider } from "../../../../shared/infra/providers/implementations/storageProvider/S3StorageProvider.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaProductRepository } from "../../repositories/implementations/prisma/product.repository.prisma.js";
import { UpdateProductIconController } from "./UpdateProductController.js";
import { UpdateProductIconUseCase } from "./UpdateProductIconUseCase.js";

const productRepository: PrismaProductRepository = new PrismaProductRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const storageProvider: S3StorageProvider = new S3StorageProvider();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const updateProductIconUseCase: UpdateProductIconUseCase = new UpdateProductIconUseCase(
    productRepository,
    userRepository,
    storeRepository,
    storageProvider,
    cacheProvider
);

const updateProductIconController: UpdateProductIconController = new UpdateProductIconController(
    updateProductIconUseCase
);

export { updateProductIconController }