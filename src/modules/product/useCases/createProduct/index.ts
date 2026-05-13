import { PrismaProductRepository } from "../../repositories/implementations/prisma/product.repository.prisma.js";
import { CreateProductUseCase } from "./createProductUseCase.js"
import { CreateProductController } from "./createProductController.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";

const productRepository: PrismaProductRepository = new PrismaProductRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();

const createProductUseCase: CreateProductUseCase = new CreateProductUseCase(productRepository, userRepository, redisCacheProvider, storeRepository);
const createProductController: CreateProductController = new CreateProductController(createProductUseCase);

export { createProductController }