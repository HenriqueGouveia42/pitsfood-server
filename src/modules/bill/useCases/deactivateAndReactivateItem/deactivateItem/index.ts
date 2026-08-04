import { DeactivateItemController } from "./DeactivateItemController.js";
import { DeactivateItemUseCase } from "./DeactivateItemUseCase.js";

import { PrismaBillRepository } from "../../../repositories/implementations/prisma/bill.repository.prisma.js";
import { PrismaUserRepository } from "../../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../../store/repositories/implementations/prisma/store.repository.prisma.js";

const billRepository: PrismaBillRepository = new PrismaBillRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();

const deactivateItemUseCase: DeactivateItemUseCase = new DeactivateItemUseCase(
    billRepository,
    userRepository,
    storeRepository
);

const deactivateItemController: DeactivateItemController = new DeactivateItemController(
    deactivateItemUseCase
);

export { deactivateItemController }