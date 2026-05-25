// src/modules/sale/useCases/MakeSale/index.ts

import { MakeSaleController } from "./MakeSaleController.js";
import { MakeSaleUseCase } from "./MakeSaleUseCase.js";

// Repositórios de Leitura (Fora do Túnel)
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaBillRepository } from "../../../bill/repositories/implementations/prisma/bill.repository.prisma.js";
import { PrismaProductRepository } from "../../../product/repositories/implementations/prisma/product.repository.prisma.js";

// Infraestrutura Transacional (Dentro do Túnel)
import { PrismaUnitOfWork } from "../../../../shared/infra/uow/implementations/PrismaUnitOfWork.js";
import { CloseSaleService } from "../../services/CloseSaleService.js";

// 1. Instancia os repositórios de leitura
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const billRepository: PrismaBillRepository = new PrismaBillRepository();
const productRepository: PrismaProductRepository = new PrismaProductRepository();

// 2. Instancia a transação
const prismaUnitOfWork: PrismaUnitOfWork = new PrismaUnitOfWork();
const closeSaleService: CloseSaleService = new CloseSaleService(prismaUnitOfWork);

// 3. Monta o UseCase
const makeSaleUseCase: MakeSaleUseCase = new MakeSaleUseCase(
    closeSaleService,
    productRepository,
    billRepository,
    userRepository
);

const makeSaleController: MakeSaleController = new MakeSaleController(makeSaleUseCase);

export { makeSaleController };