import { MakeSaleUseCase } from "./makeSaleUseCase.js";
import { MakeSaleController } from "./makeSaleController.js";
import { PrismaSaleRepository } from "../../repositories/implementations/prisma/sale.repository.prisma.js";
import { PrismaBillRepository } from "../../../bill/repositories/implementations/prisma/bill.repository.prisma.js";
import { PrismaProductRepository } from "../../../product/repositories/implementations/prisma/product.repository.prisma.js";

const prismaSaleRepository: PrismaSaleRepository = new PrismaSaleRepository();
const prismaBilRepository: PrismaBillRepository = new PrismaBillRepository();
const prismaProductRepository: PrismaProductRepository = new PrismaProductRepository();

const makeSaleUseCase: MakeSaleUseCase = new MakeSaleUseCase(prismaSaleRepository, prismaBilRepository, prismaProductRepository);

const makeSaleController: MakeSaleController = new MakeSaleController(makeSaleUseCase);

export { makeSaleController }