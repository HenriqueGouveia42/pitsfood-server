import { UpdateUserNameController } from "./UpdateUserNameController.js";
import { UpdateUserNameUseCase } from "./UpdateUserNameUseCase.js";

import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js";
import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import type { IController } from "../../../../shared/infra/http/protocols.js";
import { expressRouteAdapter } from "../../../../shared/infra/http/adapters/expressRouteAdapter.js";
import type { RequestHandler } from "express";

const userRepository: IUserRepository = new PrismaUserRepository();
const storeRepository: IStoreRepository = new PrismaStoreRepository();
const cacheProvider: ICacheProvider = new RedisCacheProvider();

const updateUserNameUseCase: UpdateUserNameUseCase = new UpdateUserNameUseCase(
    userRepository,
    storeRepository,
    cacheProvider
)

const IUpdateUserNameController: IController = new UpdateUserNameController(
    updateUserNameUseCase
);

const updateUserNameController: RequestHandler = expressRouteAdapter(IUpdateUserNameController)

export { updateUserNameController }