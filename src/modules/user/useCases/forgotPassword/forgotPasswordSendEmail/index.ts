import { ForgotPasswordSendEmailController } from "./ForgotPasswordSendEmailController.js";
import { ForgotPasswordSendEmailUsecase } from "./ForgotPasswordSendEmailUsecase.js";

import { ResendMailProvider } from "../../../../../shared/infra/providers/implementations/emailProvider/ResendMailProvider.js";
import { DnsEmailValidationProvider } from "../../../../../shared/infra/providers/implementations/emailValidationProvider/DnsEmailValidationProvider.js";
import { PrismaResetPassword } from "../../../repositories/implementations/prisma/password.reset.repository.prisma.js";
import { PrismaUserRepository } from "../../../repositories/implementations/prisma/user.repository.prisma.js";
import type { IController } from "../../../../../shared/infra/http/protocols.js";
import type { RequestHandler } from "express";
import { expressRouteAdapter } from "../../../../../shared/infra/http/adapters/expressRouteAdapter.js";

const resendMailProvider: ResendMailProvider = new ResendMailProvider();
const dnsEmailValidationProvider: DnsEmailValidationProvider = new DnsEmailValidationProvider();
const prismaResetPassword: PrismaResetPassword = new PrismaResetPassword();
const userRepository: PrismaUserRepository = new PrismaUserRepository();

const forgotPasswordSendEmailUsecase: ForgotPasswordSendEmailUsecase = new ForgotPasswordSendEmailUsecase(
    resendMailProvider,
    dnsEmailValidationProvider,
    prismaResetPassword,
    userRepository
);

const IForgotPasswordSendEmailController: IController = new ForgotPasswordSendEmailController(
    forgotPasswordSendEmailUsecase
);

const forgotPasswordSendEmailController: RequestHandler = expressRouteAdapter(IForgotPasswordSendEmailController)

export { forgotPasswordSendEmailController }