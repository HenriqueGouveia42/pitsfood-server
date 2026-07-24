import { RegisterStagedUserController } from "./RegisterStagedUserController.js";
import { RegisterStagedUserUseCase } from "./RegisterStagedUserUseCase.js";

import { PrismaStagedUserRepository } from "../../repositories/implementations/prisma/staged_user.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { ResendMailProvider } from "../../../../shared/infra/providers/implementations/emailProvider/ResendMailProvider.js";
import { DnsEmailValidationProvider } from "../../../../shared/infra/providers/implementations/emailValidationProvider/DnsEmailValidationProvider.js";
import { BcryptjsHashedStringProvider } from "../../../../shared/infra/providers/implementations/hashedStringProvider/BcryptjsHashedStringProvider.js";

const resendMailProvider: ResendMailProvider = new ResendMailProvider();
const prismaUserRepository: PrismaUserRepository = new PrismaUserRepository();
const prismaStagedUserRepository: PrismaStagedUserRepository = new PrismaStagedUserRepository();
const dnsEmailValidator: DnsEmailValidationProvider = new DnsEmailValidationProvider();
const bcryptjsHashedStringProvider: BcryptjsHashedStringProvider = new BcryptjsHashedStringProvider();

const registerStagedUserUseCase: RegisterStagedUserUseCase = new RegisterStagedUserUseCase(
    prismaStagedUserRepository,
    prismaUserRepository,
    resendMailProvider,
    dnsEmailValidator,
    bcryptjsHashedStringProvider
);

const registerStagedUserController: RegisterStagedUserController = new RegisterStagedUserController(registerStagedUserUseCase);

export { registerStagedUserController }