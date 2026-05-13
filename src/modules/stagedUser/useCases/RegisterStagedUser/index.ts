import { RegisterStagedUserController } from "./RegisterStagedUserController.js";
import { RegisterStagedUserUseCase } from "./RegisterStagedUserUseCase.js";

import { PrismaStagedUserRepository } from "../../repositories/implementations/prisma/staged_user.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
//import { NodemailerMailProvider } from "../../../../shared/providers/EmailProvider/implementations/NodemailerMailProvider.js"
import { ResendMailProvider } from "../../../../shared/providers/EmailProvider/implementations/ResendMailProvider.js";
import { DnsEmailValidationProvider } from "../../../../shared/providers/EmailValidationProvider/implementations/DnsEmailValidationProvider.js";
import { BcryptjsHashedStringProvider } from "../../../../shared/providers/HashedStringProvider/implementations/BcryptjsHashedStringProvider.js";

//const nodeMailerMailProvider: NodemailerMailProvider = new NodemailerMailProvider();
const resendMailProvider: ResendMailProvider = new ResendMailProvider();
const prismaUserRepository: PrismaUserRepository = new PrismaUserRepository();
const prismaStagedUserRepository: PrismaStagedUserRepository = new PrismaStagedUserRepository();
const dnsEmailValidator: DnsEmailValidationProvider = new DnsEmailValidationProvider();
const bcryptjsHashedStringProvider: BcryptjsHashedStringProvider = new BcryptjsHashedStringProvider();

const registerStagedUserUseCase: RegisterStagedUserUseCase = new RegisterStagedUserUseCase(
    prismaStagedUserRepository,
    prismaUserRepository,
    //nodeMailerMailProvider,
    resendMailProvider,
    dnsEmailValidator,
    bcryptjsHashedStringProvider
);

const registerStagedUserController: RegisterStagedUserController = new RegisterStagedUserController(registerStagedUserUseCase);

export { registerStagedUserController }