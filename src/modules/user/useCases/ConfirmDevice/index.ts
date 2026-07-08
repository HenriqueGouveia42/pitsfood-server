import { ConfirmDeviceController } from "./ConfirmDeviceController.js";
import { ConfirmDeviceUseCase } from "./ConfirmDeviceUseCase.js";

import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { JwtTokenProvider } from "../../providers/implementations/jwt/token.provider.jwt.js";
import { PrismaStoreRepository } from "../../../store/repositories/implementations/prisma/store.repository.prisma.js";

const cacheProvider: RedisCacheProvider = new RedisCacheProvider();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const tokenProvider: JwtTokenProvider = new JwtTokenProvider();
const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();


const confirmDeviceUseCase: ConfirmDeviceUseCase = new ConfirmDeviceUseCase(
    cacheProvider,
    userRepository,
    tokenProvider,
    storeRepository
);

const confirmDeviceController: ConfirmDeviceController = new ConfirmDeviceController(
    confirmDeviceUseCase
)

export { confirmDeviceController }