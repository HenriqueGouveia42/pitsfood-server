import { ForgotPasswordVerifyResetPasswordTokenController } from "./ForgotPasswordVerifyResetPasswordTokenController.js";
import { ForgotPasswordVerifyResetPasswordTokenUseCase } from "./ForgotPasswordVerifyResetPasswordTokenUseCase.js";

import { PrismaUserRepository } from "../../../repositories/implementations/prisma/user.repository.prisma.js";
import { PrismaResetPassword } from "../../../repositories/implementations/prisma/password.reset.repository.prisma.js";
import { BcryptjsHashedStringProvider } from "../../../../../shared/providers/HashedStringProvider/implementations/BcryptjsHashedStringProvider.js";

const userRepository: PrismaUserRepository = new PrismaUserRepository();
const resetPasswordRepository: PrismaResetPassword = new PrismaResetPassword();
const hashedStringProvider: BcryptjsHashedStringProvider = new BcryptjsHashedStringProvider();

const forgotPasswordVerifyResetPasswordTokenUseCase: ForgotPasswordVerifyResetPasswordTokenUseCase = new ForgotPasswordVerifyResetPasswordTokenUseCase(
    userRepository,
    resetPasswordRepository,
    hashedStringProvider
);


const forgotPasswordVerifyResetPasswordTokenController: ForgotPasswordVerifyResetPasswordTokenController = new ForgotPasswordVerifyResetPasswordTokenController(
    forgotPasswordVerifyResetPasswordTokenUseCase
);

export { forgotPasswordVerifyResetPasswordTokenController }