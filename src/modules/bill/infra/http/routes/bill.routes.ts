import { Router } from "express";

import { batchAddItemsController } from "../../../useCases/batchAddItems/index.js"

const billRoutes = Router();

billRoutes.post("/batch-add", (request, response) => {
    return batchAddItemsController.handle(request, response);
})

export { billRoutes }