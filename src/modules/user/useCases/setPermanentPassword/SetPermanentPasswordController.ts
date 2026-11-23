import { SetPermanentPasswordUseCase } from "./SetPermanentPasswordUseCase.js"
import type { IAuthenticatedHttpRequest, IController, IHttpResponse } from "../../../../shared/infra/http/protocols.js";

export type SetPermanentPasswordControllerInputDTO = {
    current_password: string,
    new_password: string,
    userId: string
}

export class SetPermanentPasswordController implements IController {

    constructor(
        private setPermanentPasswordUseCase: SetPermanentPasswordUseCase
    ){}

    public handle = async (req: IAuthenticatedHttpRequest): Promise<IHttpResponse> => { // Arrow function para evitar bind

        const { current_password, new_password } = req.body;
        const userId: string = req.user.id;

        const input: SetPermanentPasswordControllerInputDTO = {
            current_password,
            new_password,
            userId
        }

        //use case devolve o token pronto
        const { token } = await this.setPermanentPasswordUseCase.execute({ 
            current_password, 
            new_password, 
            userId 
        });

        return {
            statusCode: 200,
            body:{
                message: "Senha alterada com sucesso. Sua sessão foi renovada."
            },
            cookies: [
                {
                    name: 'token',
                    value: token,
                    options: {
                        maxAge: 1000 * 60 * 60 * 24,
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        path: '/'
                    }
                }
            ]
        }
            
    }
}