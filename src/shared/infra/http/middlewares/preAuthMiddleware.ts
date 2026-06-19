import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface IPreAuthPayload {
    userId: string;
}

// Middleware utilizado para autorizar um novo dispositivo

// 1. Busca o token JWT Http-only 'pre_auth_token' enviado pelo client - loginController -  logo após o client ter feito
//  login utilizando email e senha corretos, mas por um dispositivo nao autorizado

// 2. Verifica se o token é válido

// 3. Injeta no objeto 'request', do tipo 'Request'

export function preAuthMiddleware(
    request: Request,
    response: Response,
    next: NextFunction
) {
    // 1.
    const token = request.cookies['pre_auth_token'];

    // 2.
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

        // 3.
        request.preAuthUserId = userId;

        return next();
    } catch (error) {
        return response.status(401).json({ 
            message: "Token de autorização inválido ou expirado.", 
            code: "PRE_AUTH_INVALID" 
        });
    }
}