import { Router } from "express"
import { registerStagedUserController } from "../../../useCases/RegisterStagedUser/index.js";
import { checkVerificationCodeStageUserController } from "../../../useCases/CheckVerificationCodeStagedUser/index.js"

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
    


export { stagedUserRoutes }

