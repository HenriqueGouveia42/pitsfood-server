import { Router } from "express";

//middlewares
import { authMiddleware } from "../../../../../shared/infra/http/middlewares/authMiddleware.js";
import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js";
import { ensureStoreSelectedMiddleware } from "../../../../../shared/infra/http/middlewares/ensureStoreSelectedMiddleware.js";
import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js";

//controllers
import { loginController } from "../../../useCases/login/index.js";
import { isLoggedInController } from "../../../useCases/isLoggedIn/index.js";
import { logoutController } from "../../../useCases/logout/index.js";
import { updateUserDataController } from "../../../useCases/editUserData/index.js";
import { getUsersDataController } from "../../../useCases/getUsersData/index.js";
import { registerEmployeeController } from "../../../useCases/RegisterEmployee/index.js";
import { changePasswordController } from "../../../useCases/ChangePassword/index.js";
import { UserRole } from "../../../entities/user.js";

//schemas
import { registerEmployeeSchema } from "../zodSchemas/RegisterEmployeeSchema.js";
import { updateUserDataSchema } from "../zodSchemas/UpdateUserDataSchema.js";
import { getUsersDataSchema } from "../zodSchemas/GetUsersDataSchema.js";
import { loginSchema } from "../zodSchemas/LoginSchema.js";

const userRoutes = Router();
//rotas publicas - INICIO
userRoutes.post("/login",
    validateSchema(loginSchema),
    (request, response) => loginController.handle(request, response)
);
//rotas publicas - FIM
//
//
//
//
//
//rotas autenticadas globais (lobby) - INICIO
userRoutes.use(authMiddleware); 

userRoutes.get("/is-logged-in", (request, response) => {
    return isLoggedInController.handle(request, response);
});

userRoutes.post("/logout", (request, response) =>{
    return logoutController.handle(request, response)
});

userRoutes.post("/change-my-password",
    (request, response) =>{
        return changePasswordController.handle(request, response)
    }
);
//rotas autenticadas globais (lobby) - FIM
//
//
//
//
//
//rotas autenticadas de loja (CONTEXTO DE LOJA)
userRoutes.use(ensureStoreSelectedMiddleware);

userRoutes.get("/get-all-users-data",
    authorizeRoles([UserRole.GESTOR]), // Role primeiro (Performance)
    validateSchema(getUsersDataSchema), // Schema depois
    (request, response) =>{
        return getUsersDataController.handle(request, response);
    }
);

userRoutes.patch("/update-user/:target_user_id",
    authorizeRoles([UserRole.GESTOR]),
    validateSchema(updateUserDataSchema),
    (request, response) =>{
        return updateUserDataController.handle(request, response);
    }
);

userRoutes.post("/register-employee",
    authorizeRoles([UserRole.GESTOR]),
    validateSchema(registerEmployeeSchema),
    (request, response) => {
        return registerEmployeeController.handle(request, response);
    }
);
//rotas autenticadas de loja (CONTEXTO DE LOJA) - FIM
//
//
//
//
//

export { userRoutes };