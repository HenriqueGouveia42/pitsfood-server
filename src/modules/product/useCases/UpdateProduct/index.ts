import { UpdateProductController } from "./UpdateProductController.js";
import { UpdateProductUseCase } from "./UpdateProductUseCase.js";
import { PrismaProductRepository } from "../../repositories/implementations/prisma/product.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";


const productRepository: PrismaProductRepository = new PrismaProductRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();


const updateProductUseCase: UpdateProductUseCase = new UpdateProductUseCase(productRepository, userRepository);

const updateProductController: UpdateProductController = new UpdateProductController(updateProductUseCase);

export { updateProductController }