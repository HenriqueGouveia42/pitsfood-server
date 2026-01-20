import { GetAllActiveProductsUseCase } from "./GetAllActiveProductsUseCase.js";
import { PrismaProductRepository } from "../../repositories/implementations/prisma/product.repository.prisma.js";
import { GetAllActiveProductsController } from "./GetAllActiveProductsController.js";

const productRepository = new PrismaProductRepository();
const getAllActiveProductsUseCase: GetAllActiveProductsUseCase = new GetAllActiveProductsUseCase(productRepository);

const getAllActiveProductsController: GetAllActiveProductsController = new GetAllActiveProductsController(getAllActiveProductsUseCase);

export { getAllActiveProductsController }