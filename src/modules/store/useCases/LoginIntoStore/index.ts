import { LoginIntoStoreController } from "./LoginIntoStoreController.js";
import { LoginIntoStoreUseCase } from "./LoginIntoStoreUseCase.js";

import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { JwtTokenProvider } from "../../../user/providers/implementations/token.provider.jwt.js";

const storeRepository: PrismaStoreRepository = new PrismaStoreRepository();
const userRepository: PrismaUserRepository = new PrismaUserRepository();
const jwtProvider: JwtTokenProvider = new JwtTokenProvider();

const loginIntoStoreUseCase: LoginIntoStoreUseCase = new LoginIntoStoreUseCase(storeRepository, userRepository, jwtProvider);

const loginIntoStoreController: LoginIntoStoreController = new LoginIntoStoreController(loginIntoStoreUseCase);

export { loginIntoStoreController }