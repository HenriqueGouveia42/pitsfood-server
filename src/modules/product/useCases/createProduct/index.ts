import { PrismaProductRepository } from "../../repositories/implementations/prisma/product.repository.prisma.js";
import { CreateProductUseCase } from "./createProductUseCase.js"
import { CreateProductController } from "./createProductController.js";

const productRepository: PrismaProductRepository = new PrismaProductRepository();
const createProductUseCase: CreateProductUseCase = new CreateProductUseCase(productRepository);
const createProductController: CreateProductController = new CreateProductController(createProductUseCase);

export { createProductController }