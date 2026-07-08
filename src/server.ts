import express from "express"
import { router } from "./shared/infra/http/routes/index.js"
import { globalErrorMiddleware } from "./shared/infra/http/middlewares/globalErrorMiddleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const PORT = process.env.PORT ? process.env.PORT : 3000;

const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) 
    : [];

app.set("trust proxy", 1); 

app.use(cors({
    origin: function (origin, callback) {
        // Aceita requisições sem origem ou com a string "null" enviada pelo mobile/emuladores
        if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS Blocked] Tentativa de acesso bloqueada da origem: ${origin}`);
            callback(new Error("Não permitido pelo CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Incluí OPTIONS por segurança no preflight
    allowedHeaders: ["Content-Type", "Authorization", "x-device-id"]
}));

app.use(express.json());
app.use(cookieParser());

app.use(router);

app.use(globalErrorMiddleware);

app.listen(PORT, () => {
    console.log(`Running at ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});