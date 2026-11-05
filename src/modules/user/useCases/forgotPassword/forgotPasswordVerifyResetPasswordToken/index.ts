import { ForgotPasswordVerifyResetPasswordTokenController } from "./ForgotPasswordVerifyResetPasswordTokenController.js";
import { ForgotPasswordVerifyResetPasswordTokenUseCase } from "./ForgotPasswordVerifyResetPasswordTokenUseCase.js";

import { PrismaUserRepository } from "../../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaResetPassword } from "../../../repositories/implementations/prisma/password.reset.repository.prisma.js";
import { BcryptjsHashedStringProvider } from "../../../../../shared/infra/providers/implementations/hashedStringProvider/BcryptjsHashedStringProvider.js";

import { UpdateForgottenPasswordAndConsumeTokenService } from "../../../services/uow/UpdateForgottenPasswordAndConsumeTokenService.js";

import { PrismaUnitOfWork } from "../../../../../shared/infra/uow/implementations/PrismaUnitOfWork.js";
import type { IController } from "../../../../../shared/infra/http/protocols.js";
import type { RequestHandler } from "express";
import { expressRouteAdapter } from "../../../../../shared/infra/http/adapters/expressRouteAdapter.js";

const unitOfWork: PrismaUnitOfWork = new PrismaUnitOfWork();

const updateForgottenPasswordAndConsumeTokenService: UpdateForgottenPasswordAndConsumeTokenService = 
    new UpdateForgottenPasswordAndConsumeTokenService(
        unitOfWork
    )

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const resetPasswordRepository: PrismaResetPassword = new PrismaResetPassword();
const hashedStringProvider: BcryptjsHashedStringProvider = new BcryptjsHashedStringProvider();

const forgotPasswordVerifyResetPasswordTokenUseCase: ForgotPasswordVerifyResetPasswordTokenUseCase = new ForgotPasswordVerifyResetPasswordTokenUseCase(
    userRepository,
    resetPasswordRepository,
    hashedStringProvider,
    updateForgottenPasswordAndConsumeTokenService
);

const IForgotPasswordVerifyResetPasswordTokenController: IController = new ForgotPasswordVerifyResetPasswordTokenController(
    forgotPasswordVerifyResetPasswordTokenUseCase
);

const forgotPasswordVerifyResetPasswordTokenController: RequestHandler = expressRouteAdapter(IForgotPasswordVerifyResetPasswordTokenController)

export { forgotPasswordVerifyResetPasswordTokenController }