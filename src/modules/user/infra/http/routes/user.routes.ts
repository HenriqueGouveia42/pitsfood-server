import { Router } from "express";

import { loginController } from "../../../useCases/login/index.js";
import { isLoggedInController } from "../../../useCases/isLoggedIn/index.js";
import { authMiddleware } from "../../../../../shared/infra/http/middlewares/authMiddleware.js";
import { logoutController } from "../../../useCases/logout/index.js";

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

export { userRoutes }