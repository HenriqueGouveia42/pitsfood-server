import { UserRole } from "../../../../modules/user/entities/user.js";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {cacheProvider} from "../../providers/implementations/cacheProvider/index.js"
import { CacheKeys } from "../../../constants/cache-keys.js";
import type { ICacheProvider } from "../../../providers/interfaces/cacheProvider/ICacheProvider.js";
import type { ITokenProvider } from "../../../../modules/user/providers/interfaces/token.provider.interface.js";

interface IPayLoad {
    sub: string,
    role: UserRole,
    userId: string,
    store_id: string,
    must_change_password: boolean,
    token_version: number,
    is_paying_user: boolean
}

export function makeAuthMiddleware(
    cacheProvider: ICacheProvider,
    tokenProvider: ITokenProvider
){

    return async function authMiddleware(
        request: Request,
        response: Response,
        next: NextFunction
    ){

        let token: string | undefined = request.cookies['token'];

        if (!token && request.headers.authorization) {
            const parts = request.headers.authorization.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        }

        if(!token) return response.status(401).json({message: "Token missing"});

        try{
            
            const decoded: IPayLoad = tokenProvider.verifyToken<IPayLoad>(token);

            const { sub, role, store_id, must_change_password, token_version, is_paying_user } = decoded;

            const cacheKey: string = CacheKeys.User.TOKEN_VERSION(sub);
            const currentCacheVersion: number | null = await cacheProvider.get<number>(cacheKey);

            if (currentCacheVersion === null || Number(currentCacheVersion) !== token_version){
                
                response.clearCookie('token', {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    path: '/'
                });

                return response.status(401).json({message: "Sessão expirada ou inválida (Revogada). Faça login novamente"})
            }

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

            request.user = {
                id: sub,
                role: role,
                store_id: store_id,
                must_change_password: must_change_password,
                is_paying_user: is_paying_user,
                token_version: token_version
            }

            return next();

        }catch(error){
            return response.status(401).json({ message: "Invalid token" });
        }

    }

}