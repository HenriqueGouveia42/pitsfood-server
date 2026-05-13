import type { Request, Response } from "express"
import { CheckVerificationCodeStageUserUseCase } from "./CheckVerificationCodeStageUserUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js"

export class CheckVerificationCodeStageUserController{

    constructor(
        private checkVerificationCodeStageUserUseCase: CheckVerificationCodeStageUserUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{

        const { email, verificationCode } = req.body

        await this.checkVerificationCodeStageUserUseCase.execute({email, verificationCode})

        return res.status(200).json({message: "Usuario criado com sucesso"})

    }
}
