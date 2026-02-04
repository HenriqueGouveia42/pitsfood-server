import { UserRole } from "../../../../modules/user/entities/user.js";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../../../errors/AppError.js";
import { cacheProvider } from "../../../providers/CacheProvider/index.js";

interface IPayLoad {
    sub: string,
    role: UserRole,
    userId: string,
    store_id: string,
    must_change_password: boolean,
    token_version: number //controle de versao para invalidar tokens pela verificacao no redis,
    is_paying_user: boolean
}

export async function authMiddleware( //agora é um funcao assincrona, pois faz a consulta no redis
    request: Request,
    response: Response,
    next: NextFunction
){
    //buscar o token nos cookies
    const token = request.cookies['token'];

    if(!token) return response.status(401).json({message: "Token missing"});

    try{

        //variaveis de ambiente sao interpretadas pelo typescript como "string | undefined",
        //mas o metodo 'verify' aceita apenas estritamente 'string', por isso devemos "forcar"
        //atraves de '... as string'
        const { sub, role, store_id, must_change_password, token_version, is_paying_user } = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as IPayLoad;


        // -------------------------------------------------------------
        // VALIDAÇÃO VIA REDIS (WHITELIST) - INICIO
        // -------------------------------------------------------------

        const currentVersion: string | null = await cacheProvider.get(`user-token-version:${sub}`);

        if (!currentVersion || Number(currentVersion) !== token_version){

            response.clearCookie('token');

            return response.status(401).json({message: "Sessão expirada ou inválida (Revogada). Faça login novamente"})
        }

        // -------------------------------------------------------------
        // VALIDAÇÃO VIA REDIS (WHITELIST) - FIM
        // -------------------------------------------------------------


        //HORA DE BLOQUEAR SE FOR UM USUARIO COM SENHA PROVISORIA, OU SEJA, ENTIDADE USER QUE TEM O CAMPO "must_change_password" como true
        /////////////////////////////////////////////////////
        /////////////////////////////////////////////////////
        if(must_change_password === true){

            const allowedRouteSuffix = "/change-my-password";

            const isTargetingChangePassword: boolean = request.originalUrl.endsWith(allowedRouteSuffix);

            if (!isTargetingChangePassword){

                return response.status(403).json({
                    message: "Por motivos de segurança, você deve alterar sua senha provisória antes de continuar.",
                    code: "PASSWORD_CHANGE_REQUIRED"
                })
                
            }
        }

        
        request.user = {
            id: sub,
            role: role,
            store_id: store_id,
            must_change_password: must_change_password,
            is_paying_user: true,
            token_version: token_version
        }

        return next();

    }catch(error){
        return response.status(401).json({ message: "Invalid token" });
    }
}