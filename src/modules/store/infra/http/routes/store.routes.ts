import { Router } from "express"
import { authMiddleware } from "../../../../../shared/infra/http/middlewares/authMiddleware.js";
import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js";
import { UserRole } from "../../../../user/entities/user.js"

import { createStoreController } from "../../../useCases/CreateStore/index.js";
import { getStoreDataController } from "../../../useCases/GetStoreData/index.js";

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js";
import { createStoreSchema } from "../zodSchemas/CreateStoreSchema.js";

const storeRoutes = Router();

storeRoutes.post("/create-store",
    validateSchema(createStoreSchema),
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) => {
        return createStoreController.handle(request, response);
    }
)

storeRoutes.get("/get-store-data",
    //missing zod schema
    authMiddleware,
    (request, response) => {
        return getStoreDataController.handle(request, response);
    }
)

export { storeRoutes }