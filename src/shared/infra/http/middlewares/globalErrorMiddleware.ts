import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../errors/AppError.js";
import { DomainError } from "../../../errors/DomainError.js";
import { MulterError } from "multer";

// Dicionário de tradução: Código do Domínio -> Status HTTP
// Se o código não estiver aqui, o default será 400.
const domainErrorStatusMap: Record<string, number> = {
    'NOT_FOUND_IN_DOMAIN': 404,
    'UNAUTHORIZED_DOMAIN_ACTION': 403,
    // Adicione mapeamentos específicos aqui conforme a necessidade crescer
};

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
        } else if (err instanceof DomainError) {
            console.error(`[DomainError]: ${err.code} - ${err.message}`);
        }

        console.error("[Stack Trace]:");
        console.error(err.stack); 
        
        console.error("[Objeto Erro]:", err);
        console.error("------------------------------------------------");
    }
   
    // 1. Trata Erros de Aplicação (Lançados por UseCases, Infra, etc.)
    if (err instanceof AppError) {
        return response.status(err.statusCode).json({
            message: err.message, 
            code: err.errorCode
        });
    }

    // 2. Trata Erros de Domínio (Lançados por Entidades e Value Objects)
    if (err instanceof DomainError) {
        const statusCode = domainErrorStatusMap[err.code] || 400; // Default para 400 (Bad Request)
        
        return response.status(statusCode).json({
            message: err.message,
            code: err.code
        });
    }

    if (err instanceof MulterError) {
        // Intercepta especificamente o limite de tamanho
        if (err.code === "LIMIT_FILE_SIZE") {
            return response.status(413).json({ // 413 Payload Too Large
                message: "O arquivo enviado é muito grande. O limite máximo é 2MB.",
                code: "FILE_TOO_LARGE"
            });
        }
        
        // Trata outros erros genéricos do Multer (ex: muitos arquivos)
        return response.status(400).json({
            message: `Erro no upload: ${err.message}`,
            code: "UPLOAD_ERROR"
        });
    }

    if (err instanceof SyntaxError && "body" in err) {
        return response.status(400).json({
            message: "O corpo da requisição contém um JSON inválido.",
            code: "INVALID_JSON_PAYLOAD"
        });
    }

    // 3. Trata Erros Não Mapeados (Bugs, banco de dados fora, etc.)
    console.error(err);

    return response.status(500).json({
        message: "Internal Server Error - Ocorreu um erro inesperado.", 
        code: "UNKNOWN_ERROR"
    });
}