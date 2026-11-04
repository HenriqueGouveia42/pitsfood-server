import type { Request, Response } from "express"
import type { IController, IHttpRequest, IHttpResponse, ICookieOptions } from "../../../../shared/infra/http/protocols.js";

export class LogoutController implements IController{

    constructor(
        private readonly isCrossDomain: boolean 
    ) {}

    private getClearCookieOptions(): ICookieOptions {
        return {
            httpOnly: true,
            secure: this.isCrossDomain,      
            sameSite: this.isCrossDomain ? 'none' : 'lax',  
            path: '/',
            maxAge: 0 // maxAge 0 deleta o cookie no navegador
        };
    }
    
    handle = async (req: IHttpRequest): Promise<IHttpResponse> => {

        return {
            statusCode: 200,

            body: {
                message: "Logout realizado com sucesso", 
                isAuthenticated: false
            },

            cookies:[
                
                {
                    name: 'token',
                    value: '', // Sobrescreve com vazio
                    options: this.getClearCookieOptions()
                },
                {
                    name: 'pre_auth_token',
                    value: '', // Sobrescreve com vazio
                    options: this.getClearCookieOptions()
                }
                
            ]

        }
    }
}