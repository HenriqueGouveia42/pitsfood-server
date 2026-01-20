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

const userRoutes = Router();

userRoutes.post("/login", (request, response) =>{
    return loginController.handle(request, response);
})

userRoutes.get("/is-logged-in",  authMiddleware, (request, response) => {
    return isLoggedInController.handle(request, response);
})

userRoutes.get("/logout", (request, response) =>{
    return logoutController.handle(request, response)
})

userRoutes.get("/get-all-users-data",
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
        return getUsersDataController.handle(request, response);
    }
)

userRoutes.patch("/update-user/:id",
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
        return updateUserDataController.handle(request, response);
    }
)

userRoutes.post("/create-user",
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) => {
        return createUserController.handle(request, response);
    }
)


export { userRoutes }