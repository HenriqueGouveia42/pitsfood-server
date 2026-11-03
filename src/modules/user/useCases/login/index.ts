import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js";
import type { ITokenProvider } from "../../providers/interfaces/token.provider.interface.js";
import type { IHashedStringProvider } from "../../../../shared/providers/interfaces/hashedStringProvider/IHashedStringProvider.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import type { IMailProvider } from "../../../../shared/providers/interfaces/emailProvider/IMailProvider.js";
import type { IWhiteListViaAuthTokenVersionService } from "../../services/WhiteListViaAuthTokenVersionService.js";

import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import {  JwtTokenProvider } from "../../providers/implementations/jwt/token.provider.jwt.js"
import { BcryptjsHashedStringProvider } from "../../../../shared/infra/providers/implementations/hashedStringProvider/BcryptjsHashedStringProvider.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import { ResendMailProvider } from "../../../../shared/infra/providers/implementations/emailProvider/ResendMailProvider.js";
import { WhiteListViaAuthTokenVersionService } from "../../services/WhiteListViaAuthTokenVersionService.js";


import { LoginUseCase, type ILoginUseCase } from "./LoginUseCase.js";
import { LoginController } from "./LoginController.js";
import { DeviceAuthorizationChallengeService, type IDeviceAuthorizationChallengeService } from "../../services/DeviceAuthorizationChallengeService.js";



const userRepository: IUserRepository = new PrismaUserRepository();
const jwtProvider: ITokenProvider = new JwtTokenProvider();
const hashedStringProvider: IHashedStringProvider = new BcryptjsHashedStringProvider();
const cacheProvider: ICacheProvider = new RedisCacheProvider();
const resendMailProvider: IMailProvider = new ResendMailProvider();

const deviceAuthorizationChallenge: IDeviceAuthorizationChallengeService = new DeviceAuthorizationChallengeService(
    cacheProvider,
    resendMailProvider,
    jwtProvider
);

const whiteListCache: IWhiteListViaAuthTokenVersionService = new WhiteListViaAuthTokenVersionService(
    cacheProvider
)

const loginUseCase: ILoginUseCase = new LoginUseCase(
    userRepository,
    jwtProvider,
    hashedStringProvider,
    deviceAuthorizationChallenge,
    whiteListCache
);

const loginController = new LoginController(loginUseCase)

export {loginController}