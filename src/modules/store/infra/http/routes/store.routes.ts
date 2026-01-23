import { Router } from "express"

import { createNewStoreController } from "../../../useCases/createNewStore/index.js";


const storeRoutes = Router();

storeRoutes.post("/create-new-store",
    (request, response) => {
        return createNewStoreController.handle(request, response)
    }
)

export { storeRoutes }