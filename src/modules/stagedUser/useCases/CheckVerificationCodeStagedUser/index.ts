import { CheckVerificationCodeStageUserController } from  "./CheckVerificationCodeStageUserController.js"
import { CheckVerificationCodeStageUserUseCase } from "./CheckVerificationCodeStageUserUseCase.js";
import { PrismaStagedUserRepository } from "../../repositories/implementations/prisma/staged_user.repository.prisma.js";
import { DeleteStagedUserAndCreateUserService } from "../../services/DeleteStagedUserAndCreateUserService.js";
import { PrismaUnitOfWork } from "../../../../shared/infra/uow/implementations/PrismaUnitOfWork.js";

const prismaUnitOfWork: PrismaUnitOfWork = new PrismaUnitOfWork();
const prismaStagedUserRep: PrismaStagedUserRepository = new PrismaStagedUserRepository();
const deleteStagedUserAndCreateUserService: DeleteStagedUserAndCreateUserService = new DeleteStagedUserAndCreateUserService(prismaUnitOfWork);

const checkVerificationCodeStageUserUseCase: CheckVerificationCodeStageUserUseCase
    = new CheckVerificationCodeStageUserUseCase
    (
        prismaStagedUserRep,
        deleteStagedUserAndCreateUserService
    );
    
const checkVerificationCodeStageUserController: CheckVerificationCodeStageUserController = new CheckVerificationCodeStageUserController(checkVerificationCodeStageUserUseCase);

export { checkVerificationCodeStageUserController }