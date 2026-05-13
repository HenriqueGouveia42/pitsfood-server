import { ForgotPasswordSendEmailController } from "./ForgotPasswordSendEmailController.js";
import { ForgotPasswordSendEmailUsecase } from "./ForgotPasswordSendEmailUsecase.js";

//import { NodemailerMailProvider } from "../../../../../shared/providers/EmailProvider/implementations/NodemailerMailProvider.js";
import { ResendMailProvider } from "../../../../../shared/providers/EmailProvider/implementations/ResendMailProvider.js";
import { DnsEmailValidationProvider } from "../../../../../shared/providers/EmailValidationProvider/implementations/DnsEmailValidationProvider.js";
import { PrismaResetPassword } from "../../../repositories/implementations/prisma/password.reset.repository.prisma.js";
import { PrismaUserRepository } from "../../../repositories/implementations/prisma/user.repository.prisma.js";

//const nodeMailerMailProvider: NodemailerMailProvider = new NodemailerMailProvider();
const resendMailProvider: ResendMailProvider = new ResendMailProvider();
const dnsEmailValidationProvider: DnsEmailValidationProvider = new DnsEmailValidationProvider();
const prismaResetPassword: PrismaResetPassword = new PrismaResetPassword();
const userRepository: PrismaUserRepository = new PrismaUserRepository();

const forgotPasswordSendEmailUsecase: ForgotPasswordSendEmailUsecase = new ForgotPasswordSendEmailUsecase(
    //nodeMailerMailProvider,
    resendMailProvider,
    dnsEmailValidationProvider,
    prismaResetPassword,
    userRepository
);

const forgotPasswordSendEmailController: ForgotPasswordSendEmailController = new ForgotPasswordSendEmailController(
    forgotPasswordSendEmailUsecase
);

export { forgotPasswordSendEmailController }