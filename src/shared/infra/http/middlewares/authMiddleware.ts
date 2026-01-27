import { UserRole } from "../../../../modules/user/entities/user.js";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../../../errors/AppError.js";

interface IPayLoad {
    sub: string,
    role: UserRole,
    userId: string,
    store_id: string,
    must_change_password: boolean
}

export function authMiddleware(
    request: Request,
    response: Response,
    next: NextFunction
){
    //1. buscar o token nos cookies
    const token = request.cookies['token'];

    if(!token){
        return response.status(401).json({message: "Token missing"});
    }

    //2. verificar se o token é valido
    try{

        //variaveis de ambiente sao interpretadas pelo typescript como "string | undefined",
        //mas o metodo 'verify' aceita apenas estritamente 'string', por isso devemos "forcar"
        //atraves de '... as string'
        const { sub, role, store_id, must_change_password } = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as IPayLoad;

        //HORA DE BLOQUEAR SE FOR UM USUARIO COM SENHA PROVISORIA, OU SEJA, ENTIDADE USER QUE TEM O CAMPO "must_change_password" como true
        /////////////////////////////////////////////////////
        /////////////////////////////////////////////////////
        if(must_change_password === true){

            //vamos definir a UNICA rota permitida

            const allowedRouteSuffix = "/change-password";

            const isTargetingChangePassword: boolean = request.originalUrl.endsWith(allowedRouteSuffix);

            if (!isTargetingChangePassword){

                return response.status(403).json({
                    message: "Por motivos de segurança, você deve alterar sua senha provisória antes de continuar.",
                    code: "PASSWORD_CHANGE_REQUIRED"
                })
                
            }
        }
        //////////////////////////////////////////////////////
        //////////////////////////////////////////////////////


        request.user = {
            id: sub,
            role: role,
            store_id: store_id,
            must_change_password: must_change_password
        }

        return next();

    }catch(error){
        return response.status(401).json({ message: "Invalid token" });
    }
}