import { PrismaUserRepository } from "../../repositories/implementations/prisma/user.repository.prisma.js";
import { LoginUseCase } from "./loginUseCase.js";
import { LoginController } from "./loginController.js";
import {  JwtTokenProvider } from "../../providers/implementations/jwt/token.provider.jwt.js"

const userRepository = new PrismaUserRepository();
const jwtProvider = new JwtTokenProvider();

const loginUseCase = new LoginUseCase(userRepository, jwtProvider);

const loginController = new LoginController(loginUseCase)

export {loginController}