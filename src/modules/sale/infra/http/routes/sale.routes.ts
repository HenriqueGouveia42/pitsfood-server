import { Router } from "express"
import { authMiddleware} from "../../../../../shared/infra/http/middlewares/authMiddleware.js"
import { UserRole } from "../../../../user/entities/user.js";
import { makeSaleController } from "../../../useCases/makeSaleUseCase.ts/index.js";

import { authorizeRoles } from "../../../../../shared/infra/http/middlewares/authorizeRolesMiddleware.js"

const saleRoutes = Router();

saleRoutes.post("/make-sale",
    authMiddleware,
    authorizeRoles([UserRole.GESTOR, UserRole.CAIXA]),
    (request, response) => {
        return makeSaleController.handle(request, response)
    }
)


export { saleRoutes }