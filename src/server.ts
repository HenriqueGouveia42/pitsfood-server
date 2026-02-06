import  express  from "express"
import { router } from "./shared/infra/http/routes/index.js"
import { globalErrorMiddleware } from "./shared/infra/http/middlewares/globalErrorMiddleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const PORT = 3000;

const isProduction = process.env.NODE_ENV === "production";
const productionOrigin = process.env.ALLOWED_ORIGIN;

app.use(cors({
    origin: isProduction ? productionOrigin : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json())
app.use(cookieParser())
app.use(router);

app.use(globalErrorMiddleware);

app.get("/", (req, res) =>{
    res.json({status: "Server Working!"});
});

app.listen(PORT, () => {
    console.log(`Running at ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});