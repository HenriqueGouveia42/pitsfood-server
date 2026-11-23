import type { RequestHandler } from "express-serve-static-core";
import type { IController } from "../../../../../shared/infra/http/protocols.js";
import { RedisCacheProvider } from "../../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import type { ICacheProvider } from "../../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { PrismaStoreRepository } from "../../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import type { IStoreRepository } from "../../../../store/repositories/interfaces/store.repository.interface.js";
import { PrismaUserRepository } from "../../../repositories/implementations/prisma/user.repository.prisma.js";
import type { IUserRepository } from "../../../repositories/interfaces/user.repository.interface.js";
import { AuthorizeDeviceService } from "../../../services/AuthorizeDeviceService.js";
import { ApproveDeviceByManagerController } from "./ApproveDeviceByManagerController.js";
import { ApproveDeviceByManagerUseCase } from "./ApproveDeviceByManagerUseCase.js";
import { expressRouteAdapter } from "../../../../../shared/infra/http/adapters/expressRouteAdapter.js";

const userRepository: IUserRepository = new PrismaUserRepository();
const storeRepository: IStoreRepository = new PrismaStoreRepository();
const cacheProvider: ICacheProvider = new RedisCacheProvider();

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

const IApproveDeviceByManagerController: IController = new ApproveDeviceByManagerController(
    approveDeviceByManagerUsecase
);

const approveDeviceByManagerController: RequestHandler = expressRouteAdapter(IApproveDeviceByManagerController);

export { approveDeviceByManagerController }