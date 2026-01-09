import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../../../../modules/user/entities/user.js";

export function authorizeRoles(allowedRoles: UserRole[]){

    return (request: Request, response: Response, next: NextFunction) =>{

        if(!request.user){
            return response.status(401).json({message: "Usuario nao autenticado"});
        }

        if(!allowedRoles.includes(request.user.role as UserRole)){
            return response.status(403).json({message: "Acesso negado: Permissões insuficientes para realizar esta operação"})
        }

        return next();
    }
}