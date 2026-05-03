import { RegisterStagedUserController } from "./RegisterStagedUserController.js";
import { RegisterStagedUserUseCase } from "./RegisterStagedUserUseCase.js";

import { PrismaStagedUserRepository } from "../../repositories/implementations/prisma/staged_user.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { NodemailerMailProvider } from "../../../../shared/providers/EmailProvider/implementations/NodemailerMailProvider.js";
import { DnsEmailValidationProvider } from "../../../../shared/providers/EmailValidationProvider/implementations/DnsEmailValidationProvider.js";

const nodeMailerMailProvider: NodemailerMailProvider = new NodemailerMailProvider();
const prismaUserRepository: PrismaUserRepository = new PrismaUserRepository();
const prismaStagedUserRepository: PrismaStagedUserRepository = new PrismaStagedUserRepository();
const dnsEmailValidator: DnsEmailValidationProvider = new DnsEmailValidationProvider();


const registerStagedUserUseCase: RegisterStagedUserUseCase = new RegisterStagedUserUseCase(
    prismaStagedUserRepository,
    prismaUserRepository,
    nodeMailerMailProvider,
    dnsEmailValidator
);

const registerStagedUserController: RegisterStagedUserController = new RegisterStagedUserController(registerStagedUserUseCase);

export { registerStagedUserController }