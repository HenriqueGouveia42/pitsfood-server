import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../errors/AppError.js";

export function ensureStoreSelectedMiddleware(
    request: Request,
    response: Response,
    next: NextFunction
) {
    //verifica se o usuário existe (garantia que o authMiddleware rodou antes)
    if (!request.user) {
        throw new AppError("Erro interno: Usuário não autenticado no contexto.", 500, "INTERNAL_SERVER_ERROR");
    }

    //verifica se o store_id está preenchido no Token
    //se for null ou undefined, significa que ele está com o "Token do Lobby"
    if (!request.user.store_id) {
        throw new AppError(
            "Você precisa estar logado em uma loja para realizar esta ação.",
            403,
            "STORE_CONTEXT_REQUIRED"
        );
    }

    //se tem store_id, deixa passar para o Controller
    return next();
}