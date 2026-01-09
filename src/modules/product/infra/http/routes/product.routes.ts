import { Router } from "express"
import { authMiddleware} from "../../../../../shared/infra/http/middlewares/authMiddleware.js"
import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js"
import { createProductController } from "../../../useCases/createProduct/index.js"
import { UserRole } from "../../../../user/entities/user.js";

const productRoutes = Router();

productRoutes.post("/create-product",
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
    return createProductController.handle(request, response);
} )

export { productRoutes }

