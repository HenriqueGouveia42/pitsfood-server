import { ConfirmDeviceController } from "./ConfirmDeviceController.js";
import { ConfirmDeviceUseCase } from "./ConfirmDeviceUseCase.js";

import { RedisCacheProvider } from "../../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import { JwtTokenProvider } from "../../../providers/implementations/jwt/token.provider.jwt.js";
import { AuthorizeDeviceService } from "../../../services/AuthorizeDeviceService.js";
import { PrismaUserRepository } from "../../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaStoreRepository } from "../../../../store/repositories/implementations/prisma/store.repository.prisma.js";
import type { IController } from "../../../../../shared/infra/http/protocols.js";
import type { RequestHandler } from "express";
import { expressRouteAdapter } from "../../../../../shared/infra/http/adapters/expressRouteAdapter.js";

const isCrossDomain: boolean = process.env.NODE_ENV === 'production'

const cacheProvider: RedisCacheProvider = new RedisCacheProvider();
const tokenProvider: JwtTokenProvider = new JwtTokenProvider();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();


const authorizeDeviceService: AuthorizeDeviceService = new AuthorizeDeviceService(
    userRepository,
    storeRepository,
    cacheProvider
);

const confirmDeviceUseCase: ConfirmDeviceUseCase = new ConfirmDeviceUseCase(
    cacheProvider,
    tokenProvider,
    authorizeDeviceService
)

const IConfirmDeviceController: IController= new ConfirmDeviceController(
    confirmDeviceUseCase,
    isCrossDomain
)

const confirmDeviceController: RequestHandler = expressRouteAdapter(IConfirmDeviceController)

export { confirmDeviceController }