import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { IController, IHttpRequest } from '../protocols.js';

export const expressRouteAdapter = (controller: IController): RequestHandler => {
    // Retorna um RequestHandler válido para o Express
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Converte o (req) do Express para a nossa IHttpRequest pura
            const httpRequest: IHttpRequest = {
                body: req.body,
                params: req.params,
                query: req.query,
                headers: req.headers as Record<string, string | string[] | undefined>,
                // Dados que os seus middlewares injetam no req do Express
                user: (req as any).user, 
                preAuthUserId: (req as any).preAuthUserId
            };

            // 2. Chama o controller agnóstico passando apenas o IHttpRequest
            const httpResponse = await controller.handle(httpRequest);

            // 3. Lê a resposta do controller e aplica os cookies no Express
            if (httpResponse.cookies) {
                for (const cookie of httpResponse.cookies) {
                    res.cookie(cookie.name, cookie.value, cookie.options || {});
                }
            }

            // 4. Envia o JSON final com o status code correto
            res.status(httpResponse.statusCode).json(httpResponse.body);
            
        } catch (error) {
            // Se o controller lançar um AppError, passamos para o middleware de erro do Express
            next(error); 
        }
    };
};