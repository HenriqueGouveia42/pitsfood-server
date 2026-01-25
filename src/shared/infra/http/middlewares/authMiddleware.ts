import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface IPayLoad {
    sub: string,
    role: string,
    userId: string,
    store_id: string,
    //must_change_password: boolean -> esse campo vai servir para bloquear usuarios criados pelo GESTOR que ainda nao mudaram a senha inicial criada pelo GESTOR
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
        const { sub, role, store_id } = jwt.verify(token, process.env.JWT_SECRET as string) as IPayLoad;

        //const { sub, role, store_id, must_change_password } = jwt.verify(token, process.env.JWT_SECRET as string) as IPayLoad;



        request.user = {
            id: sub,
            role: role,
            store_id: store_id,
            //must_change_password: boolean
        }

        return next();

    }catch(error){
        return response.status(401).json({ message: "Invalid token" });
    }
}