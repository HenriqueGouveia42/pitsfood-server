import { response, Router } from "express";

import { loginController } from "../../../useCases/login/index.js";
import { isLoggedInController } from "../../../useCases/isLoggedIn/index.js";
import { authMiddleware } from "../../../../../shared/infra/http/middlewares/authMiddleware.js";
import { logoutController } from "../../../useCases/logout/index.js";
import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js";
import { UserRole } from "../../../entities/user.js";
import { updateUserDataController } from "../../../useCases/editUserData/index.js";
import { getUsersDataController } from "../../../useCases/getUsersData/index.js";
import { createUserController } from "../../../useCases/createUser/index.js";

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js";
import { createUserSchema } from "../zodSchemas/CreateUserSchema.js";
import { updateUserDataSchema } from "../zodSchemas/UpdateUserDataSchema.js";
import { getUsersDataSchema } from "../zodSchemas/GetUsersDataSchema.js";
import { loginSchema } from "../zodSchemas/LoginSchema.js";
const userRoutes = Router();

userRoutes.post("/login",
    validateSchema(loginSchema),
    (request, response) =>{
    return loginController.handle(request, response);
})

userRoutes.get("/is-logged-in",  authMiddleware, (request, response) => {
    return isLoggedInController.handle(request, response);
})

userRoutes.get("/logout", (request, response) =>{
    return logoutController.handle(request, response)
})

userRoutes.get("/get-all-users-data",
    validateSchema(getUsersDataSchema),
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
        return getUsersDataController.handle(request, response);
    }
)

userRoutes.patch("/update-user/:id",
    validateSchema(updateUserDataSchema),
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
        return updateUserDataController.handle(request, response);
    }
)

userRoutes.post("/create-user",
    validateSchema(createUserSchema),
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) => {
        return createUserController.handle(request, response);
    }
)


export { userRoutes }