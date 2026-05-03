import type { Request, Response } from "express"
import { ForgotPasswordSendEmailUsecase } from "./ForgotPasswordSendEmailUsecase.js"

import type { InputDTO as UseCaseInputDTO } from "./ForgotPasswordSendEmailUsecase.js"

export class ForgotPasswordSendEmailController{
    constructor(
        private forgotPasswordSendEmailUsecase: ForgotPasswordSendEmailUsecase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const email: string = req.body;

        const input: UseCaseInputDTO = {
            email
        }

        await this.forgotPasswordSendEmailUsecase.execute(input);

        return res.status(200).json({message: "Email enviado"});
    }
}