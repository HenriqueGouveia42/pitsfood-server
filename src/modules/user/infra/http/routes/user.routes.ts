import { SecureRouteBuilder } from "../../../../../shared/infra/http/routes/SecureRouteBuilder.js";
import { UserRole } from "../../../entities/user.js";

import { loginController } from "../../../useCases/login/index.js";
import { isLoggedInController } from "../../../useCases/isLoggedIn/index.js";
import { logoutController } from "../../../useCases/logout/index.js";
import { getUsersDataController } from "../../../useCases/getUsersData/index.js";
import { registerEmployeeController } from "../../../useCases/registerEmployee/index.js";
import { setPermanentPasswordController } from "../../../useCases/setPermanentPassword/index.js";
import { forgotPasswordSendEmailController } from "../../../useCases/forgotPassword/forgotPasswordSendEmail/index.js";
import { forgotPasswordVerifyResetPasswordTokenController } from "../../../useCases/forgotPassword/forgotPasswordVerifyResetPasswordToken/index.js";
import { getPendingDevicesController } from "../../../useCases/deviceUseCases/getPendingDevices/index.js";
import { approveDeviceByManagerController } from "../../../useCases/deviceUseCases/approveDeviceByManager/index.js";

import { registerEmployeeSchema } from "../zodSchemas/RegisterEmployeeSchema.js";
import { getUsersDataSchema } from "../zodSchemas/GetUsersDataSchema.js";
import { loginSchema } from "../zodSchemas/LoginSchema.js";
import { confirmDeviceController } from "../../../useCases/deviceUseCases/confirmDevice/index.js";
import { updateUserNameController } from "../../../useCases/updateUserName/index.js";
import { updateUserPasswordController } from "../../../useCases/updateUserPassword/index.js";
import { updateUserStatusController } from "../../../useCases/udateUserStatus/index.js";
import { unauthorizeDeviceController } from "../../../useCases/deviceUseCases/unauthorizeDevice/index.js";

const userRouteBuilder = new SecureRouteBuilder();


userRouteBuilder.build({
    method: 'post',
    path: '/login',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    schema: loginSchema,
    handler: loginController
});

userRouteBuilder.build({
    method: 'post',
    path: '/forgot-password-send-email',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    handler: forgotPasswordSendEmailController
})

userRouteBuilder.build({
    method: 'post',
    path: '/forgot-password-verify-reset-token',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    handler: forgotPasswordVerifyResetPasswordTokenController
})

userRouteBuilder.build({
    method: 'post',
    path: '/confirm-device',
    security: 'REQUIRE_PRE_AUTH',
    roles: 'PUBLIC',
    handler: confirmDeviceController
}),

userRouteBuilder.build({
    method: 'get',
    path: '/is-logged-in',
    security: 'REQUIRE_AUTH',
    roles: 'PUBLIC',
    handler: isLoggedInController
});

userRouteBuilder.build({
    method: 'post',
    path: '/logout',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    handler: logoutController
});

userRouteBuilder.build({
    method: 'get',
    path: '/get-all-users-data',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    schema: getUsersDataSchema,
    handler: getUsersDataController
});

userRouteBuilder.build({
    method: 'get',
    path: '/pending-authorization-devices',
    security: 'REQUIRE_STORE', // Nível 2
    roles: [UserRole.GESTOR],
    handler: getPendingDevicesController
});

userRouteBuilder.build({
    method: 'post',
    path: '/approve-pending-device',
    security: 'REQUIRE_STORE', // Nível 2
    roles: [UserRole.GESTOR],
    //schema:
    handler: (request, response) => approveDeviceByManagerController.handle(request, response)
});

userRouteBuilder.build({
    method: 'post',
    path: '/change-my-password',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: 'PUBLIC',
    handler: (request, response) => setPermanentPasswordController.handle(request, response)
});

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

export const userRoutes = userRouteBuilder.getRouter();