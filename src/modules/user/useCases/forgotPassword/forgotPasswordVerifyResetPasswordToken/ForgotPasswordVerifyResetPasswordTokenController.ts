import type { Request, Response } from "express"
import { ForgotPasswordVerifyResetPasswordTokenUseCase } from "./ForgotPasswordVerifyResetPasswordTokenUseCase.js"

export class ForgotPasswordVerifyResetPasswordTokenController{
    constructor(
        private forgotPasswordVerifyResetPasswordTokenUseCase: ForgotPasswordVerifyResetPasswordTokenUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const { email, reset_token, new_password  } = req.body

        await this.forgotPasswordVerifyResetPasswordTokenUseCase.execute({
            email,
            reset_token,
            new_password
        });

        return res.status(200).json({message: "Senha ressetada com sucesso"});
    }
}