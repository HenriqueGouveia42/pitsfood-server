import { Router } from "express";

import { authMiddleware } from "../../../../../shared/infra/http/middlewares/authMiddleware.js";
import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js";
import { ensureStoreSelectedMiddleware } from "../../../../../shared/infra/http/middlewares/ensureStoreSelectedMiddleware.js";

import { UserRole } from "../../../../user/entities/user.js";

import { batchAddItemsController } from "../../../useCases/batchAddItems/index.js"
import { getOpenBillByGtinCodeController } from "../../../useCases/getOpenBillByGtinCode/index.js"
import { findAllOpenBillsController } from "../../../useCases/findAllOpenBills/index.js"
import { billCodeExistsController } from "../../../useCases/checkIfBillCodeExists/index.js";

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js";
import { batchAddItemsSchema } from "../zodSchemas/batchAddItemsSchema.js";
import { billCodeExistsSchema } from "../zodSchemas/BillCodeExistsSchema.js";
import { GetOpenBillByGtinCodeSchema } from "../zodSchemas/GetOpenBillByGtinCodeSchema.js"


const billRoutes = Router();

billRoutes.post("/batch-add",
    validateSchema(batchAddItemsSchema),
    authMiddleware,
    ensureStoreSelectedMiddleware,
    authorizeRoles([UserRole.CAIXA, UserRole.VENDEDOR]),
    (request, response) => {
    return batchAddItemsController.handle(request, response);
})

billRoutes.get("/bill-code-exists/:bill_code_gtin",
    validateSchema(billCodeExistsSchema),
    authMiddleware,
    ensureStoreSelectedMiddleware,
    authorizeRoles([UserRole.CAIXA, UserRole.VENDEDOR]),
    (request, response) => {
        return billCodeExistsController.handle(request, response);
    }
)

billRoutes.get("/get-open-bill-by-gtin-code/:bill_code_gtin",
    validateSchema(GetOpenBillByGtinCodeSchema),
    authMiddleware,
    ensureStoreSelectedMiddleware,
    authorizeRoles([UserRole.CAIXA, UserRole.VENDEDOR]),
    (request, response) =>{
    return getOpenBillByGtinCodeController.handle(request, response);
})

billRoutes.get("/get-all-open-bills",
    authMiddleware,
    ensureStoreSelectedMiddleware,
    authorizeRoles([UserRole.CAIXA, UserRole.VENDEDOR]),
    (request, response) => {
        return findAllOpenBillsController.handle(request, response);
    }
)


export { billRoutes }