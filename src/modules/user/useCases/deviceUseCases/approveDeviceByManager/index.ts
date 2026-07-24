import { RedisCacheProvider } from "../../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import { PrismaStoreRepository } from "../../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../repositories/implementations/prisma/user.repository.prisma.js";
import { AuthorizeDeviceService } from "../../../services/AuthorizeDeviceService.js";
import { ApproveDeviceByManagerController } from "./ApproveDeviceByManagerController.js";
import { ApproveDeviceByManagerUseCase } from "./ApproveDeviceByManagerUseCase.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const authorizeDeviceService: AuthorizeDeviceService = new AuthorizeDeviceService(
    userRepository,
    storeRepository,
    cacheProvider
);

const approveDeviceByManagerUsecase: ApproveDeviceByManagerUseCase = new ApproveDeviceByManagerUseCase(
    authorizeDeviceService,
    userRepository,
    cacheProvider
);

const approveDeviceByManagerController: ApproveDeviceByManagerController = new ApproveDeviceByManagerController(
    approveDeviceByManagerUsecase
);

export { approveDeviceByManagerController }