import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface IPreAuthPayload {
    userId: string;
}

export function preAuthMiddleware(
    request: Request,
    response: Response,
    next: NextFunction
) {
    // Busca o token temporário plantado pelo LoginController
    const token = request.cookies['pre_auth_token'];

    if (!token) {
        return response.status(401).json({ 
            message: "Sessão de autorização expirada ou não iniciada.", 
            code: "PRE_AUTH_MISSING" 
        });
    }

    try {
        const { userId } = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as IPreAuthPayload;

        // Injeta na tipagem que atualizamos no seu Express.Request
        request.preAuthUserId = userId;

        return next();
    } catch (error) {
        return response.status(401).json({ 
            message: "Token de autorização inválido ou expirado.", 
            code: "PRE_AUTH_INVALID" 
        });
    }
}