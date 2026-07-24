import { SetPermanentPasswordController } from "./SetPermanentPasswordController.js";
import { SetPermanentPasswordUseCase } from "./SetPermanentPasswordUseCase.js";
import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import { JwtTokenProvider } from "../../providers/implementations/jwt/token.provider.jwt.js";

//JwtTokenProvider

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const redisCacheProvider: RedisCacheProvider = new RedisCacheProvider();
const jwtTokenProvider: JwtTokenProvider = new JwtTokenProvider();

const setPermanentPasswordUseCase: SetPermanentPasswordUseCase = new SetPermanentPasswordUseCase(userRepository, jwtTokenProvider, redisCacheProvider);

const setPermanentPasswordController: SetPermanentPasswordController = new SetPermanentPasswordController(setPermanentPasswordUseCase);

export { setPermanentPasswordController }