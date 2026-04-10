import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../errors/AppError.js";

export function globalErrorMiddleware(
    err: Error, 
    request: Request,
    response: Response,
    next: NextFunction
) {

    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment){
        console.error("---------------- ERRO CAPTURADO ----------------");
        console.error(`[Data]: ${new Date().toISOString()}`);
        console.error(`[Rota]: ${request.method} ${request.path}`);
        
        if (err instanceof AppError) {
            console.error(`[AppError]: ${err.errorCode} (Status ${err.statusCode})`);
        }

        console.error("[Stack Trace]:");
        console.error(err.stack); 
        
        console.error("[Objeto Erro]:", err);
        console.error("------------------------------------------------");
    }
   
    if (err instanceof AppError) {
        return response.status(err.statusCode).json({
            message: err.message, 
            code: err.errorCode
        });
    }

    console.log(err);

    return response.status(500).json({
        message: "Internal Server Error - Ocorreu um erro inesperado.", 
        code: "UNKNOWN_ERROR"
    });
}