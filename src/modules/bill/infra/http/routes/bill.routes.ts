import { UserRole } from "../../../../user/entities/user.js";
import { SecureRouteBuilder } from "../../../../../shared/infra/http/SecureRouteBuilder.js";

// Controllers
import { batchAddItemsController } from "../../../useCases/batchAddProducts/index.js";
import { getOpenBillByGtinCodeController } from "../../../useCases/getOpenBillByGtinCode/index.js"
import { findAllOpenBillsController } from "../../../useCases/findAllOpenBills/index.js"
import { billCodeExistsController } from "../../../useCases/checkIfBillCodeExists/index.js";
import { getPhysicalBIllCodesController } from "../../../useCases/getPhysicalBilllCodes/index.js";

// Schemas
import { batchAddItemsSchema } from "../zodSchemas/batchAddItemsSchema.js";
import { billCodeExistsSchema } from "../zodSchemas/BillCodeExistsSchema.js";
import { GetOpenBillByGtinCodeSchema } from "../zodSchemas/GetOpenBillByGtinCodeSchema.js"
import { sseController } from "../../../useCases/listenBillEvents/SSEController.js";

const billRouteBuilder = new SecureRouteBuilder();

// ==========================================
// NÍVEL 3: REQUER ASSINATURA ATIVA (Uso do PDV/Comandas)
// ==========================================

billRouteBuilder.build({
    method: 'get',
    path: '/physical-bills-codes',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    // schema: physicalBillsCodesSchema, // missing zod schema
    handler: (request, response) => getPhysicalBIllCodesController.handle(request, response)
});

billRouteBuilder.build({
    method: 'post',
    path: '/batch-add',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.CAIXA, UserRole.VENDEDOR, UserRole.GESTOR],
    schema: batchAddItemsSchema, // schema reativado através do builder
    handler: (request, response) => batchAddItemsController.handle(request, response)
});

billRouteBuilder.build({
    method: 'get',
    path: '/bill-code-exists/:bill_code_gtin',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.CAIXA, UserRole.VENDEDOR, UserRole.GESTOR],
    schema: billCodeExistsSchema,
    handler: (request, response) => billCodeExistsController.handle(request, response)
});

billRouteBuilder.build({
    method: 'get',
    path: '/get-open-bill-by-gtin-code/:bill_code_gtin',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.CAIXA, UserRole.VENDEDOR],
    schema: GetOpenBillByGtinCodeSchema,
    handler: (request, response) => getOpenBillByGtinCodeController.handle(request, response)
});

billRouteBuilder.build({
    method: 'get',
    path: '/get-all-open-bills',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.CAIXA, UserRole.VENDEDOR, UserRole.GESTOR],
    handler: (request, response) => findAllOpenBillsController.handle(request, response)
});

billRouteBuilder.build({
    method: 'get',
    path:'/events/bills',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.CAIXA, UserRole.GESTOR],
    handler: (request, response) => sseController.handle(request, response)
})

export const billRoutes = billRouteBuilder.getRouter();