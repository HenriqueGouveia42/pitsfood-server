import { GetSubscriptionDataController } from "./GetSubscriptionDataController.js";
import { GetSubscriptionDataUseCase } from "./GetSubscriptionDataUseCase.js";

import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();

const getSubscriptionDataUseCase: GetSubscriptionDataUseCase = new GetSubscriptionDataUseCase(storeRepository);

const getSubscriptionDataController: GetSubscriptionDataController =
    new GetSubscriptionDataController(getSubscriptionDataUseCase);

export { getSubscriptionDataController }