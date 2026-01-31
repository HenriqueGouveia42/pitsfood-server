import { GetAllProductsUseCase } from "./GetAllProductsUseCase.js";
import { PrismaProductRepository } from "../../repositories/implementations/prisma/product.repository.prisma.js";
import { GetAllProductsController } from "./GetAllProductsController.js";

const productRepository = new PrismaProductRepository();
const getAllActiveProductsUseCase: GetAllProductsUseCase = new GetAllProductsUseCase(productRepository);

const getAllProductsController: GetAllProductsController = new GetAllProductsController(getAllActiveProductsUseCase);

export { getAllProductsController }