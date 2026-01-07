import  express  from "express"
import type { Request, Response, NextFunction } from "express"
import { router } from "./shared/infra/http/routes/index.js"
import cookieParser from "cookie-parser";

const app = express();

const PORT = 3000;

app.use(express.json())
app.use(cookieParser())
app.use(router);

app.get("/", (req, res) =>{
    res.json({status: "Server Running!"});
});

app.listen(PORT, () =>{
    console.log(`Running at ${PORT}`)
})