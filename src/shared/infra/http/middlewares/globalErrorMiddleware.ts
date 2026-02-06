import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../errors/AppError.js";
import { error } from "node:console";

export function globalErrorMiddleware(
    err: Error,
    request: Request,
    response: Response,
    next: NextFunction
) {

    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment){
        console.log(error)
    }
   
    if (err instanceof AppError) {
        return response.status(err.statusCode).json({message: err.message, code: err.errorCode});
    }


    return response.status(500).json({ message: "Internal Server Error - Ocorreu um erro inesperado.", code: "UNKNOW_ERROR"});
}