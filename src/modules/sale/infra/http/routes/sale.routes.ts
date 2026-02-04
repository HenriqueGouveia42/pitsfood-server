import { Router } from "express"
import { authMiddleware} from "../../../../../shared/infra/http/middlewares/authMiddleware.js"
import { ensureStoreSelectedMiddleware } from "../../../../../shared/infra/http/middlewares/ensureStoreSelectedMiddleware.js";

import { UserRole } from "../../../../user/entities/user.js";
import { makeSaleController } from "../../../useCases/makeSaleUseCase.ts/index.js";
import { getSalesSummaryByPeriodController } from "../../../useCases/getSalesSummaryByPeriodUseCase/index.js";

import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js"

import { validateSchema } from "../../../../../shared/infra/http/middlewares/validateSchemaMiddleware.js";
import { makeSaleSchema } from "../zodSchemas/MakeSaleSchema.js";
import { getSalesSummarySchema } from "../zodSchemas/GetSalesSummaryByPeriodSchema.js";

const saleRoutes = Router();

saleRoutes.use(ensureStoreSelectedMiddleware);

saleRoutes.post("/make-sale",
    validateSchema(makeSaleSchema),
    authMiddleware,
    authorizeRoles([UserRole.GESTOR, UserRole.CAIXA]),
    (request, response) => {
        return makeSaleController.handle(request, response)
    }
)

saleRoutes.get("/summary",
    validateSchema(getSalesSummarySchema),
    authMiddleware,
    authorizeRoles([UserRole.GESTOR]),
    (request, response) => {
        return getSalesSummaryByPeriodController.handle(request, response);
    }
)


export { saleRoutes }