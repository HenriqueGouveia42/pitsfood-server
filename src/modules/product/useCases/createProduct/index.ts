import { PrismaProductRepository } from "../../repositories/implementations/prisma/product.repository.prisma.js";
import { CreateProductUseCase } from "./CreateProductUseCase.js"
import { CreateProductController } from "./CreateProductController.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";

const productRepository: PrismaProductRepository = new PrismaProductRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();

const createProductUseCase: CreateProductUseCase = new CreateProductUseCase(productRepository, userRepository, redisCacheProvider, storeRepository);
const createProductController: CreateProductController = new CreateProductController(createProductUseCase);

export { createProductController }