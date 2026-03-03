import { response, Router } from "express"
import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js";

import { authMiddleware } from "../../../../../shared/infra/http/middlewares/authMiddleware.js";
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
import { updateStoreIconController } from "../../../useCases/UpdateStoreIcon/index.js";
import { updateStoreDataController } from "../../../useCases/UpdateStoreData/index.js";

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js";
import { createStoreSchema } from "../zodSchemas/CreateStoreSchema.js";

import multer from "multer";

import { uploadConfig } from "../../../../../config/uploads.js"; 
const upload = multer(uploadConfig);

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
    authorizeRoles([UserRole.GESTOR]),
    (request, response) => {
        return listMyStoresController.handle(request, response)
    }
)

storeRoutes.post("/login-into-store",
    //missing zod schema
    authorizeRoles([UserRole.GESTOR]),
    (request, response) =>{
        return loginIntoStoreController.handle(request, response)
    }
)

storeRoutes.use(ensureStoreSelectedMiddleware);

//gera o qr code
storeRoutes.post("/generate-subscription-pix",
    authorizeRoles([UserRole.GESTOR]),
    (request, response) => {
        return generateSubscriptionPixController.handle(request, response)
    }
)

//rota de pooling
storeRoutes.get("/check-payment-status/:invoice_id",
    authorizeRoles([UserRole.GESTOR]),
    (request, response) => {
        return checkPaymentStatusController.handle(request, response);
    }
);

storeRoutes.get("/plan-and-plan-status",
    authorizeRoles([UserRole.GESTOR]),
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

storeRoutes.patch("/icon",
    authorizeRoles([UserRole.GESTOR]),
    upload.single("icon"),
    (request, response) => {
        return updateStoreIconController.handle(request, response);
    }
)

storeRoutes.patch("/name",
    authorizeRoles([UserRole.GESTOR]),
    //missing zod schema
    (request, response) => {
        return updateStoreDataController.handle(request, response);
    }
)


export { storeRoutes }