import { MakeSaleController } from "./MakeSaleController.js";
import { MakeSaleUseCase } from "./MakeSaleUseCase.js";

import { PrismaSaleRepository } from "../../repositories/implementations/prisma/sale.repository.prisma.js";
import { PrismaProductRepository } from "../../../product/repositories/implementations/prisma/product.repository.prisma.js";
import { PrismaBillRepository } from "../../../bill/repositories/implementations/prisma/bill.repository.prisma.js";

const saleRepository: PrismaSaleRepository = new PrismaSaleRepository();
const productRepository: PrismaProductRepository = new PrismaProductRepository();
const billRepository: PrismaBillRepository = new PrismaBillRepository();

const makeSaleUseCase: MakeSaleUseCase = new MakeSaleUseCase(saleRepository, productRepository, billRepository);

const makeSaleController: MakeSaleController = new MakeSaleController(makeSaleUseCase);

export { makeSaleController }