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
import { checkPaymentStatusController } from "../../../useCases/CheckPaymentStatus/index.js"; // <--- Importante

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js";
import { createStoreSchema } from "../zodSchemas/CreateStoreSchema.js";


const storeRoutes = Router();

// =================================================================
// ZONA 1: PÚBLICA (Webhooks)
// O AbacatePay bate aqui sem token.
// =================================================================
storeRoutes.post("/webhook/payment",
    (request, response) => {
        return handleAbacateWebhookController.handle(request, response);
    }
);

// =================================================================
// ZONA 2: AUTENTICADA GERAL (Auth Middleware)
// Daqui para baixo, exige Token JWT.
// =================================================================
storeRoutes.use(authMiddleware);

storeRoutes.post("/create-store",
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
    (request, response) =>{
        return loginIntoStoreController.handle(request, response)
    }
)

// =================================================================
// ZONA 3: CONTEXTO DE LOJA (Store Selected)
// O usuário já escolheu a loja.
// Estas rotas DEVEM funcionar mesmo se a loja estiver DEVENDO (PAST_DUE),
// para que o usuário consiga ver o status e pagar.
// =================================================================
storeRoutes.use(ensureStoreSelectedMiddleware);

// Rota de Metadados: O front usa isso para saber se mostra a Dashboard ou a Tela de Bloqueio
storeRoutes.get("/get-store-data",
    (request, response) => {
        return getStoreDataController.handle(request, response);
    }
)

// Rota de Pagamento: Gera o QR Code
storeRoutes.post("/generate-subscription-pix",
    authorizeRoles([UserRole.GESTOR]),
    (request, response) => {
        return generateSubscriptionPixController.handle(request, response)
    }
)

// Rota de Polling: Front pergunta "Já pagou?" a cada 3s
storeRoutes.get("/check-payment-status/:invoice_id",
    (request, response) => {
        return checkPaymentStatusController.handle(request, response);
    }
);

// =================================================================
// ZONA 4: VIP (Assinatura Ativa)
// DAQUI PARA BAIXO, SÓ PASSA QUEM ESTÁ COM O PAGAMENTO EM DIA.
// Aqui entram rotas de negócio: Produtos, Vendas, Funcionários, etc.
// =================================================================

storeRoutes.use(ensureSubscriptionActiveMiddleware);

// Exemplo futuro:
// storeRoutes.post("/create-product", createProductController.handle);

export { storeRoutes }