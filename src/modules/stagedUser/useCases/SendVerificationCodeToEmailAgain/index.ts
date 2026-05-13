import { SendVerificationCodeToEmailAgainController } from "./SendVerificationCodeToEmailAgainController.js";
import { SendVerificationCodeToEmailAgainUseCase } from "./SendVerificationCodeToEmailAgainUsecase.js";

import { PrismaStagedUserRepository } from "../../repositories/implementations/prisma/staged_user.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import { StagedUserNodeMailerSendEmail } from "../../providers/implementations/staged.user.send.email.nodemailer.js";

const prismaStagedUserRepository: PrismaStagedUserRepository = new PrismaStagedUserRepository();
const prismaUserRepository: PrismaUserRepository = new PrismaUserRepository();
const stagedUserNodeMailerSendEmail: StagedUserNodeMailerSendEmail = new StagedUserNodeMailerSendEmail();


const sendVerificationCodeToEmailAgainUseCase: SendVerificationCodeToEmailAgainUseCase = new SendVerificationCodeToEmailAgainUseCase(
    prismaStagedUserRepository,
    prismaUserRepository,
    stagedUserNodeMailerSendEmail
);

const sendVerificationCodeToEmailAgainController: SendVerificationCodeToEmailAgainController = new SendVerificationCodeToEmailAgainController(
    sendVerificationCodeToEmailAgainUseCase
);

export { sendVerificationCodeToEmailAgainController }