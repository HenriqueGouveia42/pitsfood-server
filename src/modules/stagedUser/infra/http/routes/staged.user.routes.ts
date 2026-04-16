import { response, Router } from "express"
import { registerStagedUserController } from "../../../useCases/RegisterStagedUser/index.js";
import { checkVerificationCodeStageUserController } from "../../../useCases/CheckVerificationCodeStagedUser/index.js"
import { sendVerificationCodeToEmailAgainController } from "../../../useCases/SendVerificationCodeToEmailAgain/index.js";

const stagedUserRoutes = Router();

stagedUserRoutes.post("/create-staged-user",
    (request, response) =>{
        return registerStagedUserController.handle(request, response);
    }
)

stagedUserRoutes.post("/confirm-registration",
    (request, response) => {
        return checkVerificationCodeStageUserController.handle(request, response);
    }
)

stagedUserRoutes.post("/send-email-again",
    (request, response) => {
        return sendVerificationCodeToEmailAgainController.handle(request, response);
    }
)
    


export { stagedUserRoutes }

