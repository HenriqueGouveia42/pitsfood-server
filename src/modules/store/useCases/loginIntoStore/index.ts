import { LoginIntoStoreController } from "./LoginIntoStoreController.js";
import { LoginIntoStoreUseCase } from "./LoginIntoStoreUseCase.js";

import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { JwtTokenProvider } from "../../../user/providers/implementations/jwt/token.provider.jwt.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const jwtProvider: JwtTokenProvider = new JwtTokenProvider();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const loginIntoStoreUseCase: LoginIntoStoreUseCase = new LoginIntoStoreUseCase(storeRepository, userRepository, jwtProvider, cacheProvider);

const loginIntoStoreController: LoginIntoStoreController = new LoginIntoStoreController(loginIntoStoreUseCase);

export { loginIntoStoreController }