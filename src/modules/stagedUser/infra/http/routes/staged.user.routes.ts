import { SecureRouteBuilder } from "../../../../../shared/infra/http/routes/SecureRouteBuilder.js";

// Controllers
import { registerStagedUserController } from "../../../useCases/RegisterStagedUser/index.js";
import { checkVerificationCodeStageUserController } from "../../../useCases/CheckVerificationCodeStagedUser/index.js";
import { sendVerificationCodeToEmailAgainController } from "../../../useCases/SendVerificationCodeToEmailAgain/index.js";

const stagedUserRouteBuilder = new SecureRouteBuilder();

stagedUserRouteBuilder.build({
    method: 'post',
    path: '/create-staged-user',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    // schema: registerStagedUserSchema, // Descomente e adicione quando tiver os schemas do zod prontos
    handler: (request, response) => registerStagedUserController.handle(request, response)
});

stagedUserRouteBuilder.build({
    method: 'post',
    path: '/confirm-registration',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    // schema: confirmRegistrationSchema,
    handler: (request, response) => checkVerificationCodeStageUserController.handle(request, response)
});

stagedUserRouteBuilder.build({
    method: 'post',
    path: '/send-email-again',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    // schema: sendEmailAgainSchema,
    handler: (request, response) => sendVerificationCodeToEmailAgainController.handle(request, response)
});

export const stagedUserRoutes = stagedUserRouteBuilder.getRouter();