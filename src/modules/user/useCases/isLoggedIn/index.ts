import { IsLoggedInController } from "./IsLoggedInController.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import type { IController } from "../../../../shared/infra/http/protocols.js";
import type { RequestHandler } from "express-serve-static-core";
import { expressRouteAdapter } from "../../../../shared/infra/http/adapters/expressRouteAdapter.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();

const IIsLoggedInController: IController = new IsLoggedInController(userRepository)

const isLoggedInController: RequestHandler = expressRouteAdapter(IIsLoggedInController);

export { isLoggedInController }