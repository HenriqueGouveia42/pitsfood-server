import { response, Router } from "express";

import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js";

import { authMiddleware } from "../../../../../shared/infra/http/middlewares/authMiddleware.js";
import { ensureStoreSelectedMiddleware } from "../../../../../shared/infra/http/middlewares/ensureStoreSelectedMiddleware.js";
import { ensureSubscriptionActiveMiddleware } from "../../../../../shared/infra/http/middlewares/ensureSubscriptionActiveMiddleware.js";

import { User, UserRole } from "../../../../user/entities/user.js";

import { batchAddItemsController } from "../../../useCases/batchAddProducts/index.js";
import { getOpenBillByGtinCodeController } from "../../../useCases/getOpenBillByGtinCode/index.js"
import { findAllOpenBillsController } from "../../../useCases/findAllOpenBills/index.js"
import { billCodeExistsController } from "../../../useCases/checkIfBillCodeExists/index.js";
import { getPhysicalBIllCodesController } from "../../../useCases/GetPhysicalBilllCodes/index.js";

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js";
import { batchAddItemsSchema } from "../zodSchemas/batchAddItemsSchema.js";
import { billCodeExistsSchema } from "../zodSchemas/BillCodeExistsSchema.js";
import { GetOpenBillByGtinCodeSchema } from "../zodSchemas/GetOpenBillByGtinCodeSchema.js"

//import {  }


const billRoutes = Router();

billRoutes.use(authMiddleware);
billRoutes.use(ensureStoreSelectedMiddleware);
billRoutes.use(ensureSubscriptionActiveMiddleware);

billRoutes.get("/physical-bills-codes",
    //missing zod schema
    authorizeRoles([UserRole.GESTOR]),
    (request, response) => {
        return getPhysicalBIllCodesController.handle(request, response)
    }
)

billRoutes.post("/batch-add",
    //validateSchema(batchAddItemsSchema),
    authorizeRoles([UserRole.CAIXA, UserRole.VENDEDOR, UserRole.GESTOR]),
    (request, response) => {
    return batchAddItemsController.handle(request, response);
})

billRoutes.get("/bill-code-exists/:bill_code_gtin",
    validateSchema(billCodeExistsSchema),
    authorizeRoles([UserRole.CAIXA, UserRole.VENDEDOR]),
    (request, response) => {
        return billCodeExistsController.handle(request, response);
    }
)

billRoutes.get("/get-open-bill-by-gtin-code/:bill_code_gtin",
    validateSchema(GetOpenBillByGtinCodeSchema),
    authorizeRoles([UserRole.CAIXA, UserRole.VENDEDOR]),
    (request, response) =>{
    return getOpenBillByGtinCodeController.handle(request, response);
})

billRoutes.get("/get-all-open-bills",
    authorizeRoles([UserRole.CAIXA, UserRole.VENDEDOR,  UserRole.GESTOR]),
    (request, response) => {
        return findAllOpenBillsController.handle(request, response);
    }
)


export { billRoutes }