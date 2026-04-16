import { User, UserRole } from "../../../../user/entities/user.js";
import { SecureRouteBuilder } from "../../../../../shared/infra/http/SecureRouteBuilder.js";

// Controllers
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

// Schemas
import { createStoreSchema } from "../zodSchemas/CreateStoreSchema.js";

// Uploads
import multer from "multer";
import { uploadConfig } from "../../../../../config/uploads.js"; 

const upload = multer(uploadConfig);
const storeRouteBuilder = new SecureRouteBuilder();


// ROTAS PÚBLICAS
storeRouteBuilder.build({
    method: 'post',
    path: '/webhook/payment',
    security: 'PUBLIC',
    roles: 'PUBLIC',
    handler: (request, response) => handleAbacateWebhookController.handle(request, response)
});

// NÍVEL 1: REQUER APENAS USUÁRIO LOGADO
storeRouteBuilder.build({
    method: 'post',
    path: '/create-store',
    security: 'REQUIRE_AUTH',
    roles: [UserRole.GESTOR],
    schema: createStoreSchema,
    handler: (request, response) => createStoreController.handle(request, response)
});

storeRouteBuilder.build({
    method: 'get',
    path: '/list-my-stores',
    security: 'REQUIRE_AUTH',
    roles: [UserRole.GESTOR],
    handler: (request, response) => listMyStoresController.handle(request, response)
});

storeRouteBuilder.build({
    method: 'post',
    path: '/login-into-store',
    security: 'REQUIRE_AUTH',
    roles: [UserRole.GESTOR],
    // schema: loginIntoStoreSchema, // Adicionar quando criar o schema
    handler: (request, response) => loginIntoStoreController.handle(request, response)
});

// NÍVEL 2: REQUER LOJA SELECIONADA NA SESSÃO
storeRouteBuilder.build({
    method: 'post',
    path: '/generate-subscription-pix',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    handler: (request, response) => generateSubscriptionPixController.handle(request, response)
});

storeRouteBuilder.build({
    method: 'get',
    path: '/check-payment-status/:invoice_id',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    handler: (request, response) => checkPaymentStatusController.handle(request, response)
});

storeRouteBuilder.build({
    method: 'get',
    path: '/plan-and-plan-status',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    handler: (request, response) => getPlanAndPlanStatusController.handle(request, response)
});

storeRouteBuilder.build({
    method: 'get',
    path: '/plans',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    handler: (request, response) => getPlansController.handle(request, response)
});

storeRouteBuilder.build({
    method: 'post',
    path: '/renew-subscription',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    // schema: renewSubscriptionSchema, // Adicionar quando criar o schema
    handler: (request, response) => { 
        // Lógica a ser implementada
        return response.status(501).json({ message: "Not implemented yet" });
    }
});

// NÍVEL 3: REQUER ASSINATURA ATIVA
storeRouteBuilder.build({
    method: 'get',
    path: '/get-store-data',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: 'PUBLIC', // Na sua rota original não havia restrição de Role
    handler: (request, response) => getStoreDataController.handle(request, response)
});

storeRouteBuilder.build({
    method: 'patch',
    path: '/icon',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    middlewares: [upload.single("icon")], // Middleware injetado perfeitamente
    handler: (request, response) => updateStoreIconController.handle(request, response)
});

storeRouteBuilder.build({
    method: 'patch',
    path: '/name',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    // schema: updateStoreNameSchema, // Adicionar quando criar o schema
    handler: (request, response) => updateStoreDataController.handle(request, response)
});

export const storeRoutes = storeRouteBuilder.getRouter();