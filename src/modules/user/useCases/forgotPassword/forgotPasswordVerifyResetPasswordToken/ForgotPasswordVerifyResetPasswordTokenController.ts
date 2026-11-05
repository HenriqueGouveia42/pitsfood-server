import { ForgotPasswordVerifyResetPasswordTokenUseCase } from "./ForgotPasswordVerifyResetPasswordTokenUseCase.js"
import type { IController, IHttpRequest, IHttpResponse } from "../../../../../shared/infra/http/protocols.js";

export type ForgotPasswordVerifyResetPasswordTokenControllerInputDTO = {
    email: string,
    reset_token: string,
    new_password: string
}

export class ForgotPasswordVerifyResetPasswordTokenController implements IController{
    
    constructor(
        private forgotPasswordVerifyResetPasswordTokenUseCase: ForgotPasswordVerifyResetPasswordTokenUseCase
    ){}

    handle = async (req: IHttpRequest<ForgotPasswordVerifyResetPasswordTokenControllerInputDTO>): Promise<IHttpResponse> => {

        const { email, reset_token, new_password  } = req.body as ForgotPasswordVerifyResetPasswordTokenControllerInputDTO;

        await this.forgotPasswordVerifyResetPasswordTokenUseCase.execute({
            email,
            reset_token,
            new_password
        });

        const responsePayload: any = {
            message: "Senha ressetada com sucesso"
        }

        return{
            statusCode: 200,
            body: responsePayload
        }

    }
}