import { UserRole } from "../../../../modules/user/entities/user.js";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../../../errors/AppError.js";
import { cacheProvider } from "../../../providers/CacheProvider/index.js";
import { CacheKeys } from "../../../constants/cache-keys.js";

interface IPayLoad {
    sub: string,
    role: UserRole,
    userId: string,
    store_id: string,
    must_change_password: boolean,
    token_version: number //controle de versao para invalidar tokens pela verificacao no redis,
    is_paying_user: boolean
}

// Middleware principal de autenticação e autorização das rotas

// 1. Validação no cache - WhiteList
// 2. Se for um usuário com senha provisória - que precisa ser trocada - permite somente o acesso a rota de troca de senha
// 3. Anexa dados no objeto do tipo 'Request' - que serão utilizados por outros middlewares, controllers, usecases e services

export async function authMiddleware( //agora é um funcao assincrona, pois faz a consulta no redis
    request: Request,
    response: Response,
    next: NextFunction
){
    const token = request.cookies['token'];

    if(!token) return response.status(401).json({message: "Token missing"});

    try{

        const { sub, role, store_id, must_change_password, token_version, is_paying_user } = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as IPayLoad;

        // 1.
        const cacheKey: string = CacheKeys.User.TOKEN_VERSION(sub);
        const currentCacheVersion: number | null = await cacheProvider.get<number>(cacheKey);

        if (currentCacheVersion === null || Number(currentCacheVersion) !== token_version){

            response.clearCookie('token');
            return response.status(401).json({message: "Sessão expirada ou inválida (Revogada). Faça login novamente"})
        }

        // 2.
        if(must_change_password === true){

            const allowedRouteSuffix: string = "/change-my-password";

            const isTargetingChangePassword: boolean = request.originalUrl.endsWith(allowedRouteSuffix);

            if (!isTargetingChangePassword){

                return response.status(403).json({
                    message: "Por motivos de segurança, você deve alterar sua senha provisória antes de continuar.",
                    code: "PASSWORD_CHANGE_REQUIRED"
                })
                
            }
        }

        // 3.
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