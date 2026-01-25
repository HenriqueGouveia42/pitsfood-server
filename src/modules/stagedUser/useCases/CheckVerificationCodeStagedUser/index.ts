import { CheckVerificationCodeStageUserController } from  "./CheckVerificationCodeStageUserController.js"
import { CheckVerificationCodeStageUserUseCase } from "./CheckVerificationCodeStageUserUseCase.js";
import { PrismaStagedUserRepository } from "../../repositories/implementations/staged_user.repository.prisma.js";

const prismaStagedUserRep: PrismaStagedUserRepository = new PrismaStagedUserRepository();
const checkVerificationCodeStageUserUseCase: CheckVerificationCodeStageUserUseCase = new CheckVerificationCodeStageUserUseCase(prismaStagedUserRep);
const checkVerificationCodeStageUserController: CheckVerificationCodeStageUserController = new CheckVerificationCodeStageUserController(checkVerificationCodeStageUserUseCase);

export { checkVerificationCodeStageUserController }