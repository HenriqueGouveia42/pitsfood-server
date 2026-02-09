import { GetPlanAndPlanStatusController } from "./GetPlanAndPlanStatusController.js";
import { GetPlanAndPlanStatusUseCase } from "./GetPlanAndPlanStatusUseCase.js";

import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();

const getPlanAndPlanStatusUseCase: GetPlanAndPlanStatusUseCase = new GetPlanAndPlanStatusUseCase(storeRepository);

const getPlanAndPlanStatusController: GetPlanAndPlanStatusController = new GetPlanAndPlanStatusController(getPlanAndPlanStatusUseCase);

export { getPlanAndPlanStatusController }