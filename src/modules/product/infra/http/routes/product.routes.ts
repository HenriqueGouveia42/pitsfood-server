import { response, Router } from "express"
import { authMiddleware} from "../../../../../shared/infra/http/middlewares/authMiddleware.js"
import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js"
import { createProductController } from "../../../useCases/createProduct/index.js"
import { getAllProductsController } from "../../../useCases/getAllProducts/index.js"
import { UserRole } from "../../../../user/entities/user.js";

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js"
import { CreateProductSchema } from "../zodSchemas/CreateProductSchema.js"
import { updateProductController } from "../../../useCases/UpdateProduct/index.js"
import { makeStockEntryController } from "../../../useCases/MakeStockEntry/index.js"
import { listStockEntriesController } from "../../../useCases/ListStockEntries/index.js"
import { ListStockEntriesSchema } from "../zodSchemas/ListStockEntriesSchema.js"

const productRoutes = Router();

productRoutes.post("/create-product",
    validateSchema(CreateProductSchema),
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
    return createProductController.handle(request, response);
} )

productRoutes.get("/get-all-products",
    authMiddleware,
    (request, response) =>{
        return getAllProductsController.handle(request, response);
    }
)

productRoutes.patch("/update-product/:product_id",
    //missing zod schema
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
        return updateProductController.handle(request, response);
    }
)

productRoutes.post("/make-entry-stock/:product_id",
    //missing zod schema
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
        return makeStockEntryController.handle(request, response)
    }

)

productRoutes.get("/stock-entries/history",
    validateSchema(ListStockEntriesSchema),
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
        return listStockEntriesController.handle(request, response);
    }
)

export { productRoutes }

