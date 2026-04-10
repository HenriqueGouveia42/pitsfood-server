import { ChangePasswordController } from "./ChangePasswordController.js";
import { ChangePasswordUseCase } from "./ChangePasswordUseCase.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/providers/CacheProvider/implementations/RedisCacheProvider.js";
import { JwtTokenProvider } from "../../providers/implementations/jwt/token.provider.jwt.js";

//JwtTokenProvider

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();
const jwtTokenProvider: JwtTokenProvider = new JwtTokenProvider();

const changePasswordUseCase: ChangePasswordUseCase = new ChangePasswordUseCase(userRepository, jwtTokenProvider, redisCacheProvider);

const changePasswordController: ChangePasswordController = new ChangePasswordController(changePasswordUseCase);

export { changePasswordController }