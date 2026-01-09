import { Router } from "express";
import { authMiddleware } from "../../../../../shared/infra/http/middlewares/authMiddleware.js";

import { batchAddItemsController } from "../../../useCases/batchAddItems/index.js"
import { getOpenBillByGtinCodeController } from "../../../useCases/getOpenBillByGtinCode/index.js"

const billRoutes = Router();

billRoutes.post("/batch-add",
    authMiddleware,
    (request, response) => {
    return batchAddItemsController.handle(request, response);
})

billRoutes.get("/get-open-bill-by-gtin-code/:bill_code_gtin",
    authMiddleware,
    (request, response) =>{
    return getOpenBillByGtinCodeController.handle(request, response);
})

export { billRoutes }