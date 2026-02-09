import { Router } from "express"
import { authMiddleware } from "../../../../../shared/infra/http/middlewares/authMiddleware.js";
import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js";
import { ensureStoreSelectedMiddleware } from "../../../../../shared/infra/http/middlewares/ensureStoreSelectedMiddleware.js";
import { ensureSubscriptionActiveMiddleware } from "../../../../../shared/infra/http/middlewares/ensureSubscriptionActiveMiddleware.js";

import { UserRole } from "../../../../user/entities/user.js"

import { createStoreController } from "../../../useCases/CreateStore/index.js";
import { getStoreDataController } from "../../../useCases/GetStoreData/index.js";
import { listMyStoresController } from "../../../useCases/ListMyStores/index.js";
import { loginIntoStoreController } from "../../../useCases/LoginIntoStore/index.js";
import { generateSubscriptionPixController } from "../../../useCases/GenerateSubscriptionPix/index.js";
import { handleAbacateWebhookController } from "../../../useCases/HandleAbacateWebhook/index.js";
import { checkPaymentStatusController } from "../../../useCases/CheckPaymentStatus/index.js";
import { getPlanAndPlanStatusController } from "../../../useCases/GetPlanAndPlanStatus/index.js";
import { getPlansController } from "../../../useCases/GetPlans/index.js";

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js";
import { createStoreSchema } from "../zodSchemas/CreateStoreSchema.js";


const storeRoutes = Router();

storeRoutes.post("/webhook/payment",
    //missing zod schema
    (request, response) => {
        return handleAbacateWebhookController.handle(request, response);
    }
);

storeRoutes.use(authMiddleware);

storeRoutes.post("/create-store",
    //missing zod schema
    authorizeRoles([UserRole.GESTOR]),
    validateSchema(createStoreSchema),
    (request, response) => {
        return createStoreController.handle(request, response);
    }
)

storeRoutes.get("/list-my-stores",
    (request, response) => {
        return listMyStoresController.handle(request, response)
    }
)

storeRoutes.post("/login-into-store",
    //missing zod schema
    (request, response) =>{
        return loginIntoStoreController.handle(request, response)
    }
)

storeRoutes.use(ensureStoreSelectedMiddleware);

//gera o qr code
storeRoutes.post("/generate-subscription-pix",
    //missing zod schema
    authorizeRoles([UserRole.GESTOR]),
    (request, response) => {
        return generateSubscriptionPixController.handle(request, response)
    }
)

//rota de pooling
storeRoutes.get("/check-payment-status/:invoice_id",
    (request, response) => {
        return checkPaymentStatusController.handle(request, response);
    }
);

storeRoutes.get("/plan-and-plan-status",
    (request, response) => {
        return getPlanAndPlanStatusController.handle(request, response)
    }
)

storeRoutes.get("/plans",
    (request, response) => {
        return getPlansController.handle(request, response);
    }
)

storeRoutes.use(ensureSubscriptionActiveMiddleware);

storeRoutes.get("/get-store-data",
    (request, response) => {
        return getStoreDataController.handle(request, response);
    }
)

// Exemplo futuro:
// storeRoutes.post("/create-product", createProductController.handle);

export { storeRoutes }