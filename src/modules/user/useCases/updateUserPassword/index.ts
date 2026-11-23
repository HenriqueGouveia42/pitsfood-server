import { UpdateUserPasswordController } from "./UpdateUserPasswordController.js";
import { UpdateUserPasswordUseCase } from "./UpdateUserPasswordUsecase.js";

import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import type { IController } from "../../../../shared/infra/http/protocols.js";
import type { RequestHandler } from "express";
import { expressRouteAdapter } from "../../../../shared/infra/http/adapters/expressRouteAdapter.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const updateUserPasswordCUseCase: UpdateUserPasswordUseCase = new UpdateUserPasswordUseCase(
    userRepository,
    storeRepository,
    cacheProvider
);

const IUpdateUserPasswordController: IController = new UpdateUserPasswordController(
    updateUserPasswordCUseCase
);

const updateUserPasswordController: RequestHandler = expressRouteAdapter(IUpdateUserPasswordController)

export { updateUserPasswordController }