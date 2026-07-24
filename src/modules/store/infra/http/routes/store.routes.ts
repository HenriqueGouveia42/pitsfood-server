import { User, UserRole } from "../../../../user/entities/user.js";
import { SecureRouteBuilder } from "../../../../../shared/infra/http/routes/SecureRouteBuilder.js";

// Controllers
import { createStoreController } from "../../../useCases/createStore/index.js";
import { getStoreDataController } from "../../../useCases/getStoreData/index.js";
import { listMyStoresController } from "../../../useCases/listMyStores/index.js";
import { loginIntoStoreController } from "../../../useCases/loginIntoStore/index.js";
import { generateFirstSubscriptionPixController } from "../../../useCases/subscriptions/generateFirstSubscriptionPix/index.js";
import { handleAbacateWebhookController } from "../../../useCases/subscriptions/handleAbacateWebhook/index.js";
import { checkPaymentStatusController } from "../../../useCases/subscriptions/checkPaymentStatus/index.js";
import { getSubscriptionDataController } from "../../../useCases/getPlanAndPlanStatus/index.js";
import { getPlansController } from "../../../useCases/getPlans/index.js";
import { updateStoreIconController } from "../../../useCases/updateStoreIcon/index.js";
import { updateStoreDataController } from "../../../useCases/updateStoreData/index.js";

// Schemas
import { createStoreSchema } from "../zodSchemas/CreateStoreSchema.js";

// Uploads
import multer from "multer";
import { uploadConfig } from "../../../../../config/uploads.js"; 
import { renewSubscriptionController } from "../../../useCases/subscriptions/renewSubscription/index.js";
import { simulateSubscriptionPaymentController } from "../../../useCases/subscriptions/simulateSubscriptionPayment/index.js";

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
    security: 'REQUIRE_AUTH_AUTHORIZED_DEVICE',
    roles: [UserRole.GESTOR],
    // schema: loginIntoStoreSchema, // Adicionar quando criar o schema
    handler: (request, response) => loginIntoStoreController.handle(request, response)
});

// NÍVEL 2: REQUER LOJA SELECIONADA NA SESSÃO
storeRouteBuilder.build({
    method: 'post',
    path: '/generate-first-subscription-pix',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    handler: (request, response) => generateFirstSubscriptionPixController.handle(request, response)
});

storeRouteBuilder.build({
    method: 'post',
    path:'/simulate-subscription-payment',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    handler: (request, response) => simulateSubscriptionPaymentController.handle(request, response)
})

storeRouteBuilder.build({
    method: 'get',
    path: '/check-payment-status/:invoice_id',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    handler: (request, response) => checkPaymentStatusController.handle(request, response)
});

storeRouteBuilder.build({
    method: 'get',
    path: '/subscription-data',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    handler: (request, response) => getSubscriptionDataController.handle(request, response)
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
    handler: (request, response) => renewSubscriptionController.handle(request, response)
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

storeRouteBuilder.build({
    method: 'post',
    path: '/renew-subscription',
    security: 'REQUIRE_STORE',
    roles: [UserRole.GESTOR],
    handler: (request, response) => renewSubscriptionController.handle(request, response)
})

export const storeRoutes = storeRouteBuilder.getRouter();