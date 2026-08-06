import { ReactivateItemController } from "./ReactivateItemController.js";
import { ReactivateItemUseCase } from "./ReactivateItemUsecase.js";

import { PrismaBillRepository } from "../../../repositories/implementations/prisma/bill.repository.prisma.js";
import { PrismaUserRepository } from "../../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../../store/repositories/implementations/prisma/store.repository.prisma.js";

const billRepository: PrismaBillRepository = new PrismaBillRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();

const reactivateItemUseCase: ReactivateItemUseCase = new ReactivateItemUseCase(
    billRepository,
    userRepository,
    storeRepository
);

const reactivateItemController: ReactivateItemController = new ReactivateItemController(
    reactivateItemUseCase
);

export { reactivateItemController }

