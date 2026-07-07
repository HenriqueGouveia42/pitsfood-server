import { SecureRouteBuilder } from "../../../../../shared/infra/http/SecureRouteBuilder.js";
import { UserRole } from "../../../entities/user.js";

// Controllers
import { loginController } from "../../../useCases/login/index.js";
import { isLoggedInController } from "../../../useCases/isLoggedIn/index.js";
import { logoutController } from "../../../useCases/logout/index.js";
import { getUsersDataController } from "../../../useCases/getUsersData/index.js";
import { registerEmployeeController } from "../../../useCases/RegisterEmployee/index.js";
import { setPermanentPasswordController } from "../../../useCases/SetPermanentPassword/index.js";
import { forgotPasswordSendEmailController } from "../../../useCases/ForgotPassword/ForgotPasswordSendEmail/index.js";
import { forgotPasswordVerifyResetPasswordTokenController } from "../../../useCases/ForgotPassword/ForgotPasswordVerifyResetPasswordToken/index.js";

// Schemas
import { registerEmployeeSchema } from "../zodSchemas/RegisterEmployeeSchema.js";
import { getUsersDataSchema } from "../zodSchemas/GetUsersDataSchema.js";
import { loginSchema } from "../zodSchemas/LoginSchema.js";
import { confirmDeviceController } from "../../../useCases/ConfirmDevice/index.js";
import { updateUserNameController } from "../../../useCases/UpdateUserName/index.js";
import { updateUserPasswordController } from "../../../useCases/UpdateUserPassword/index.js";
import { updateUserStatusController } from "../../../useCases/UpdateUserStatus/index.js";
import { unauthorizeDeviceController } from "../../../useCases/UnauthorizeDevice/index.js";

const userRouteBuilder = new SecureRouteBuilder();


// ROTAS PÚBLICAS
userRouteBuilder.build({
    method: 'post',
    path: '/login',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    schema: loginSchema, // Adicionado o schema que estava comentado no código original
    handler: (request, response) => loginController.handle(request, response)
});

userRouteBuilder.build({
    method: 'post',
    path: '/forgot-password-send-email',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    handler: (request, response) => forgotPasswordSendEmailController.handle(request, response)
})

userRouteBuilder.build({
    method: 'post',
    path: '/forgot-password-verify-reset-token',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    handler: (request, response) => forgotPasswordVerifyResetPasswordTokenController.handle(request, response)
})

// NÍVEL 0: REQUER USUARI PRE-AUTENTICADO, OU SEJA, 
// QUE ACERTOU LOGIN E SENHA, MAS DISPOSITIVO NAO ESTÁ AUTENTICADO

userRouteBuilder.build({
    method: 'post',
    path: '/confirm-device',
    security: 'REQUIRE_PRE_AUTH',
    roles: 'PUBLIC',
    handler: (request, response) => confirmDeviceController.handle(request, response)
}),


// NÍVEL 1: REQUER APENAS USUÁRIO LOGADO
userRouteBuilder.build({
    method: 'get',
    path: '/is-logged-in',
    security: 'REQUIRE_AUTH',
    roles: 'PUBLIC',
    handler: (request, response) => isLoggedInController.handle(request, response)
});

userRouteBuilder.build({
    method: 'post',
    path: '/logout',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    handler: (request, response) => logoutController.handle(request, response)
});


// NÍVEL 2: REQUER LOJA SELECIONADA NA SESSÃO
userRouteBuilder.build({
    method: 'get',
    path: '/get-all-users-data',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    schema: getUsersDataSchema,
    handler: (request, response) => getUsersDataController.handle(request, response)
});


// NÍVEL 3: REQUER ASSINATURA ATIVA
userRouteBuilder.build({
    method: 'post',
    path: '/change-my-password',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: 'PUBLIC',
    handler: (request, response) => setPermanentPasswordController.handle(request, response)
});

/*userRouteBuilder.build({
    method: 'patch',
    path: '/update-user/:target_user_id',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    schema: updateUserDataSchema,
    handler: (request, response) => updateUserDataController.handle(request, response)
});*/

userRouteBuilder.build({
    method: 'patch',
    path: '/update-name/:target_user_id',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    handler: (request, response) => updateUserNameController.handle(request, response)
})

userRouteBuilder.build({
    method: 'patch',
    path: '/update-password/:target_user_id',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    handler: (request, response) => updateUserPasswordController.handle(request, response)
})

userRouteBuilder.build({
    method: 'patch',
    path: '/update-status/:target_user_id',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    handler: (request, response) => updateUserStatusController.handle(request, response)
})

userRouteBuilder.build({
    method: 'post',
    path: '/register-employee',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    schema: registerEmployeeSchema,
    handler: (request, response) => registerEmployeeController.handle(request, response)
});

userRouteBuilder.build({
    method: 'delete',
    path: `/unauthorize-device/:user_id_target/:device_id`,
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    handler: (request, response) => unauthorizeDeviceController.handle(request, response)
})

// Exportação limpa e direta
export const userRoutes = userRouteBuilder.getRouter();