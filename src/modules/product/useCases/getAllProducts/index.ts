import { GetAllProductsUseCase } from "./GetAllProductsUseCase.js";
import { PrismaProductRepository } from "../../repositories/implementations/prisma/product.repository.prisma.js";
import { GetAllProductsController } from "./GetAllProductsController.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();
const productRepository = new PrismaProductRepository();
const getAllActiveProductsUseCase: GetAllProductsUseCase = new GetAllProductsUseCase(productRepository, redisCacheProvider);

const getAllProductsController: GetAllProductsController = new GetAllProductsController(getAllActiveProductsUseCase);

export { getAllProductsController }