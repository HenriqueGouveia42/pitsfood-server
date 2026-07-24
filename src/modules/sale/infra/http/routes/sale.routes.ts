import { UserRole } from "../../../../user/entities/user.js";
import { SecureRouteBuilder } from "../../../../../shared/infra/http/routes/SecureRouteBuilder.js";

// Controllers
import { makeSaleController } from "../../../useCases/makeSaleUseCase.ts/index.js";
import { fetchSalesSummaryByPeriodController } from "../../../useCases/FetchSalesSummaryByPeriodUseCase/index.js";
import { getPaginatedSalesController } from "../../../useCases/GetPaginatedSalesUseCase/index.js";

// Schemas
import { makeSaleSchema } from "../zodSchemas/MakeSaleSchema.js";
import { getSalesSummarySchema } from "../zodSchemas/GetSalesSummaryByPeriodSchema.js";

const saleRouteBuilder = new SecureRouteBuilder();

// ==========================================
// NÍVEL 3: REQUER ASSINATURA ATIVA
// ==========================================

saleRouteBuilder.build({
    method: 'get',
    path: '/summary',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    schema: getSalesSummarySchema,
    handler: (request, response) => fetchSalesSummaryByPeriodController.handle(request, response)
});

saleRouteBuilder.build({
    method: 'post',
    path: '/make-sale',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION', 
    roles: [UserRole.GESTOR, UserRole.CAIXA],
    schema: makeSaleSchema, // Schema reativado pelo builder
    handler: (request, response) => makeSaleController.handle(request, response)
});

saleRouteBuilder.build({
    method: 'get',
    path: '/sales-history',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.CAIXA, UserRole.GESTOR],
    //MISSING SCHEMA
    handler: (request, response) => getPaginatedSalesController.handle(request, response)
})

export const saleRoutes = saleRouteBuilder.getRouter();