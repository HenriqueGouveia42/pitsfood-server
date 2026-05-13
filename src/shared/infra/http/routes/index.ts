import { Router } from "express"
import { billRoutes } from "../../../../modules/bill/infra/http/routes/bill.routes.js"
import { userRoutes } from "../../../../modules/user/infra/http/routes/user.routes.js";
import { saleRoutes } from "../../../../modules/sale/infra/http/routes/sale.routes.js";
import  { productRoutes } from "../../../../modules/product/infra/http/routes/product.routes.js"
import { storeRoutes } from "../../../../modules/store/infra/http/routes/store.routes.js";
import { stagedUserRoutes } from "../../../../modules/stagedUser/infra/http/routes/staged.user.routes.js";

const router = Router();

router.use("/bills", billRoutes)
router.use("/user", userRoutes)
router.use("/product", productRoutes)
router.use("/sale", saleRoutes)
router.use("/store", storeRoutes)
router.use("/staged-user", stagedUserRoutes)

export { router }