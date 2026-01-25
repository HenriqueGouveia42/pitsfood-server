import { RegisterStagedUserController } from "./RegisterStagedUserController.js";
import { RegisterStagedUserUseCase } from "./RegisterStagedUserUseCase.js";

import { PrismaStagedUserRepository } from "../../repositories/implementations/staged_user.repository.prisma.js";
import { StagedUserNodeMailerSendEmail } from "../../providers/implementations/staged.user.send.email.nodemailer.js"

const stagedUserNodeMailerSendEmail: StagedUserNodeMailerSendEmail = new StagedUserNodeMailerSendEmail();
const prismaStagedUserRepository: PrismaStagedUserRepository = new PrismaStagedUserRepository();

const registerStagedUserUseCase: RegisterStagedUserUseCase = new RegisterStagedUserUseCase(prismaStagedUserRepository, stagedUserNodeMailerSendEmail );
const registerStagedUserController: RegisterStagedUserController = new RegisterStagedUserController(registerStagedUserUseCase);

export { registerStagedUserController }