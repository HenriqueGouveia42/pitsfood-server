import type { Request, Response } from "express";
import { HandleAbacateWebhookUseCase } from "./HandleAbacateWebhookUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IWebhookRequest } from "./HandleAbacateWebhookUseCase.js";

/*
    export interface IWebhookRequest {
        event: string;
        data: {
            billing: {s
                id: string;
                status: string;
                amount: number;
            }
        }
    }

*/

export class HandleAbacateWebhookController {
    
    constructor(
        private useCase: HandleAbacateWebhookUseCase
    ) {}

    async handle(req: Request, res: Response): Promise<Response> {
        
        //console.log("[Webhook Payload Bruto]:", JSON.stringify(req.body, null, 2));
        const { 
            event, 
            data 
        }: IWebhookRequest = req.body;

        if (!event || !data) throw new AppError("Erro de integracao com o gateway de pagamento", 400, "INTEGRATION_ERROR")
           
        await this.useCase.execute({
            event,
            data
        });

        return res.status(200).send();
    }
}