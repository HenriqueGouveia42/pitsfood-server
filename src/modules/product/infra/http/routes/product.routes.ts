import { UserRole } from "../../../../user/entities/user.js";
import { SecureRouteBuilder } from "../../../../../shared/infra/http/SecureRouteBuilder.js";

// Controllers
import { createProductController } from "../../../useCases/createProduct/index.js";
import { getAllProductsController } from "../../../useCases/getAllProducts/index.js";
import { updateProductController } from "../../../useCases/UpdateProduct/index.js";
import { makeStockEntryController } from "../../../useCases/MakeStockEntry/index.js";
import { listStockEntriesController } from "../../../useCases/ListStockEntries/index.js";

// Schemas
import { CreateProductSchema } from "../zodSchemas/CreateProductSchema.js";
import { ListStockEntriesSchema } from "../zodSchemas/ListStockEntriesSchema.js";

const productRouteBuilder = new SecureRouteBuilder();

// ==========================================
// NÍVEL 3: REQUER ASSINATURA ATIVA (Gestão de Produtos e Estoque)
// ==========================================

productRouteBuilder.build({
    method: 'post',
    path: '/create-product',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    schema: CreateProductSchema,
    handler: (request, response) => createProductController.handle(request, response)
});

productRouteBuilder.build({
    method: 'get',
    path: '/get-all-products',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: 'PUBLIC', // Sem restrição de cargo, pois Caixa e Vendedor precisam ver o cardápio
    handler: (request, response) => getAllProductsController.handle(request, response)
});

productRouteBuilder.build({
    method: 'patch',
    path: '/update-product/:product_id',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    // schema: updateProductSchema, // missing zod schema
    handler: (request, response) => updateProductController.handle(request, response)
});

productRouteBuilder.build({
    method: 'post',
    path: '/make-entry-stock/:product_id',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    // schema: makeStockEntrySchema, // missing zod schema
    handler: (request, response) => makeStockEntryController.handle(request, response)
});

productRouteBuilder.build({
    method: 'get',
    path: '/stock-entries/history',
    security: 'REQUIRE_ACTIVE_SUBSCRIPTION',
    roles: [UserRole.GESTOR],
    schema: ListStockEntriesSchema,
    handler: (request, response) => listStockEntriesController.handle(request, response)
});

export const productRoutes = productRouteBuilder.getRouter();