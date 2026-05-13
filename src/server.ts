import  express  from "express"
import { router } from "./shared/infra/http/routes/index.js"
import { globalErrorMiddleware } from "./shared/infra/http/middlewares/globalErrorMiddleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { AppError } from "./shared/errors/AppError.js";

const app = express();

const PORT = process.env.PORT ? process.env.PORT : 3000;

const isProduction = process.env.NODE_ENV === "production";

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", 'x-device-id']
}));

app.use(express.json())
app.use(cookieParser())

/*export function launchGuardMiddleware(req, res, next) {

    if (process.env.PITSFOOD_LAUNCHED !== "true") {
        throw new AppError("O sistema Pitsfood ainda não foi lançado ou está temporariamente indisponível.", 403);
    }
    
    next();
}

app.use(launchGuardMiddleware);*/

app.use(router);

app.use(globalErrorMiddleware);

app.get("/", (req, res) =>{
    res.json({status: "Server Working!"});
});

app.listen(PORT, () => {
    console.log(`Running at ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});