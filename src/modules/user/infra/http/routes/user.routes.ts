import { Router } from "express";

import { loginController } from "../../../useCases/login/index.js";

const userRoutes = Router();

userRoutes.post("/login", (request, response) =>{
    return loginController.handle(request, response);
})

export { userRoutes }