// src/shared/infra/http/middlewares/validateSchemaMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod"; 
import { AppError } from "../../../errors/AppError.js";

export const validateSchema = (schema: ZodType<any, any, any>) => 
(req: Request, res: Response, next: NextFunction) => {

    try {
        const validatedData = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });

        // req.body e req.params aceitam reatribuição normal (graças ao body-parser e roteador)
        if (validatedData.body !== undefined) req.body = validatedData.body;
        if (validatedData.params !== undefined) req.params = validatedData.params;
        
        // req.query é um Getter protegido no Express. Sobrescrevemos na força bruta com defineProperty:
        if (validatedData.query !== undefined) {
            Object.defineProperty(req, 'query', {
                value: validatedData.query,
                writable: true, // Libera para futuras modificações
                enumerable: true,
                configurable: true
            });
        }

        return next();

    } catch(error: any) {
        
        if (error && error.name === 'ZodError') {
            const errorMessages = error.issues.map((issue: any) => {
                const path = issue.path.join('.'); 
                return `${path}: ${issue.message}`;
            }).join(', ');

            return next(new AppError(`Dados inválidos na requisição -> ${errorMessages}`, 400, "INVALID_FORMAT"));
        }

        console.error("🔥 ERRO FATAL NA VALIDAÇÃO DO SCHEMA:", error);
        return next(new AppError("Erro interno durante a validação da requisição.", 500, "INTERNAL_VALIDATION_ERROR"));
    }
}