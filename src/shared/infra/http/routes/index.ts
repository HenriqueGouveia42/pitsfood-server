import { Router } from "express"
import { billRoutes } from "../../../../modules/bill/infra/http/routes/bill.routes.js"
import { userRoutes } from "../../../../modules/user/infra/http/routes/user.routes.js";
import  { productRoutes } from "../../../../modules/product/infra/http/routes/product.routes.js"

const router = Router();

router.use("/bills", billRoutes)
router.use("/user", userRoutes)
router.use("/product", productRoutes)

export { router }