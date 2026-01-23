import { Router } from "express"
import { authMiddleware} from "../../../../../shared/infra/http/middlewares/authMiddleware.js"
import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js"
import { createProductController } from "../../../useCases/createProduct/index.js"
import { getAllActiveProductsController } from "../../../useCases/getAllActiveProducts/index.js"
import { UserRole } from "../../../../user/entities/user.js";

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js"
import { CreateProductSchema } from "../zodSchemas/CreateProductSchema.js"

const productRoutes = Router();

productRoutes.post("/create-product",
    validateSchema(CreateProductSchema),
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
    return createProductController.handle(request, response);
} )

productRoutes.get("/get-all-active-products",
    authMiddleware,
    (request, response) =>{
        return getAllActiveProductsController.handle(request, response);
    }
)

export { productRoutes }

