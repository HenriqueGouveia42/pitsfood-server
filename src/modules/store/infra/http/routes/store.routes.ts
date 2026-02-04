import { Router } from "express"
import { authMiddleware } from "../../../../../shared/infra/http/middlewares/authMiddleware.js";
import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js";
import { ensureStoreSelectedMiddleware } from "../../../../../shared/infra/http/middlewares/ensureStoreSelectedMiddleware.js";

import { UserRole } from "../../../../user/entities/user.js"

import { createStoreController } from "../../../useCases/CreateStore/index.js";
import { getStoreDataController } from "../../../useCases/GetStoreData/index.js";

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js";
import { createStoreSchema } from "../zodSchemas/CreateStoreSchema.js";
import { listMyStoresController } from "../../../useCases/ListMyStores/index.js";
import { loginIntoStoreController } from "../../../useCases/LoginIntoStore/index.js";

const storeRoutes = Router();

storeRoutes.post("/create-store",
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    validateSchema(createStoreSchema),
    (request, response) => {
        return createStoreController.handle(request, response);
    }
)

storeRoutes.get("/list-my-stores",
    //missing zod schema,
    authMiddleware,
    (request, response) => {
        return listMyStoresController.handle(request, response)
    }
)

storeRoutes.post("/login-into-store",
    //missing zod schema
    authMiddleware,
    (request, response) =>{
        loginIntoStoreController.handle(request, response)
    }
)

storeRoutes.get("/get-store-data",
    //missing zod schema
    authMiddleware,
    ensureStoreSelectedMiddleware,
    (request, response) => {
        return getStoreDataController.handle(request, response);
    }
)



export { storeRoutes }