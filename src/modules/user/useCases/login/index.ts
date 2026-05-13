import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { LoginUseCase } from "./loginUseCase.js";
import { LoginController } from "./loginController.js";
import {  JwtTokenProvider } from "../../providers/implementations/jwt/token.provider.jwt.js"
import { BcryptjsHashedStringProvider } from "../../../../shared/providers/HashedStringProvider/implementations/BcryptjsHashedStringProvider.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";
//import { NodemailerMailProvider } from "../../../../shared/providers/EmailProvider/implementations/NodemailerMailProvider.js";
import { ResendMailProvider } from "../../../../shared/providers/EmailProvider/implementations/ResendMailProvider.js";

const userRepository = new PrismaUserRepository();
const jwtProvider = new JwtTokenProvider();
const hashedStringProvider: BcryptjsHashedStringProvider = new BcryptjsHashedStringProvider();
const cacheProvider: RedisCacheProvider = new RedisCacheProvider();
//const mailProvider: NodemailerMailProvider = new NodemailerMailProvider();
const resendMailProvider: ResendMailProvider = new ResendMailProvider();

const loginUseCase = new LoginUseCase(
    userRepository,
    jwtProvider,
    hashedStringProvider,
    cacheProvider,
    resendMailProvider
);

const loginController = new LoginController(loginUseCase)

export {loginController}