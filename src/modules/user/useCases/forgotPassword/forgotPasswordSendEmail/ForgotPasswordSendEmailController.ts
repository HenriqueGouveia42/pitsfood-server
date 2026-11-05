import { ForgotPasswordSendEmailUsecase } from "./ForgotPasswordSendEmailUsecase.js"

import type { InputDTO as UseCaseInputDTO } from "./ForgotPasswordSendEmailUsecase.js"
import type { IController, IHttpRequest, IHttpResponse } from "../../../../../shared/infra/http/protocols.js";

export type ForgotPasswordSendEmailControllerInputDTO = {
    email: string
}

export class ForgotPasswordSendEmailController implements IController{
    constructor(
        private forgotPasswordSendEmailUsecase: ForgotPasswordSendEmailUsecase
    ){}

    handle = async (req: IHttpRequest<ForgotPasswordSendEmailControllerInputDTO>): Promise<IHttpResponse> => {

        const { email } = req.body as ForgotPasswordSendEmailControllerInputDTO;

        const input: UseCaseInputDTO = {
            email
        }

        await this.forgotPasswordSendEmailUsecase.execute(input);

        const responsePayload: any = {
            message: "Codigo para reset enviado para o Email!"
        }

        return {
            statusCode: 200,
            body: responsePayload
        }
    }
}