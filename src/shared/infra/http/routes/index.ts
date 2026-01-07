import { Router } from "express"
import { billRoutes } from "../../../../modules/bill/infra/http/routes/bill.routes.js"
import { userRoutes } from "../../../../modules/user/infra/http/routes/user.routes.js";

const router = Router();

router.use("/bills", billRoutes)
router.use("/user", userRoutes)

export { router }