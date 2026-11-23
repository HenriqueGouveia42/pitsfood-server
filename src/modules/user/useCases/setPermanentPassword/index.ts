import { SetPermanentPasswordController } from "./SetPermanentPasswordController.js";
import { SetPermanentPasswordUseCase } from "./SetPermanentPasswordUseCase.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import { JwtTokenProvider } from "../../providers/implementations/jwt/token.provider.jwt.js";
import type { IController } from "../../../../shared/infra/http/protocols.js";
import type { RequestHandler } from "express";
import { expressRouteAdapter } from "../../../../shared/infra/http/adapters/expressRouteAdapter.js";


const userRepository: PrismaUserRepository = new PrismaUserRepository();
const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();
const jwtTokenProvider: JwtTokenProvider = new JwtTokenProvider();

const setPermanentPasswordUseCase: SetPermanentPasswordUseCase = new SetPermanentPasswordUseCase(userRepository, jwtTokenProvider, redisCacheProvider);

const ISetPermanentPasswordController: IController = new SetPermanentPasswordController(setPermanentPasswordUseCase);

const setPermanentPasswordController: RequestHandler = expressRouteAdapter(ISetPermanentPasswordController)

export { setPermanentPasswordController }