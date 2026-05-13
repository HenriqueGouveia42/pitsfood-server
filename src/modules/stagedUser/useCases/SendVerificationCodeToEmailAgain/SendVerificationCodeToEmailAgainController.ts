import type { Request, Response } from "express";
import { StagedUser } from "../../entities/stagedUser.js";
import { SendVerificationCodeToEmailAgainUseCase } from "./SendVerificationCodeToEmailAgainUsecase.js";

export class SendVerificationCodeToEmailAgainController{

    constructor(
        private sendVerificationCodeToEmailAgainUseCase: SendVerificationCodeToEmailAgainUseCase
    ) {}

    public async handle(req: Request, res: Response): Promise<Response>{

        const { email } = req.body;

        await this.sendVerificationCodeToEmailAgainUseCase.execute({
            email
        })

        return res.status(200).json({message: "Novo codigo enviado com sucesso"});

    }
}