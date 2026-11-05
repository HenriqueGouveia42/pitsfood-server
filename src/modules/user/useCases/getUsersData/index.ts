import { GetUsersDataUseCase } from "./GetUsersDataUseCase.js";
import { GetUsersDataController } from "./GetUsersDataController.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import type { IController } from "../../../../shared/infra/http/protocols.js";
import type { RequestHandler } from "express-serve-static-core";
import { expressRouteAdapter } from "../../../../shared/infra/http/adapters/expressRouteAdapter.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();
const getUsersDataUseCase: GetUsersDataUseCase = new GetUsersDataUseCase(userRepository, redisCacheProvider);
const IGetUsersDataController: IController = new GetUsersDataController(getUsersDataUseCase);
const getUsersDataController: RequestHandler = expressRouteAdapter(IGetUsersDataController);

export { getUsersDataController }