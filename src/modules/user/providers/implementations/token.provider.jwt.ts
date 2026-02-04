import jwt from "jsonwebtoken"

const { sign } = jwt;

import { AppError } from "../../../../shared/errors/AppError.js";
import type { ITokenProvider } from "../token.provider.interface.js";



export class JwtTokenProvider implements ITokenProvider {

    generateToken(
        userId: string,
        role: string,
        storeId: string | null,
        mustChangePassword: boolean,
        token_version: number, //versao do token
        is_paying_user: boolean
    ): string {
        
        const secret = process.env.JWT_SECRET;
        
        if(!secret){
            throw new AppError("Erro interno: SECRET não configurado", 500, "SECRET_NOT_FOUND");
        }

        return sign(
            {
                userId: userId,
                role,
                store_id: storeId,
                must_change_password: mustChangePassword,
                token_version: token_version,
                is_paying_user: is_paying_user
            },
            secret,
            {
                subject: userId,
                expiresIn: "1d"
            }
        );
    }
}