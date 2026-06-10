import type { Request, Response } from "express";
import { HandleAbacateWebhookUseCase } from "./HandleAbacateWebhookUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IWebhookRequest } from "./HandleAbacateWebhookUseCase.js";

/*
    Exemplo do Novo Payload de Webhook da v2 (transparent.completed):
    {
        "event": "transparent.completed",
        "apiVersion": 2,
        "data": {
            "transparent": {
                "id": "pix_char_abc123xyz",
                "status": "COMPLETE",
                "amount": 10000,
                "metadata": {
                    "internal_invoice_id": "uuid..."
                }
            }
        }
    }
*/

export class HandleAbacateWebhookController {
    
    constructor(
        private useCase: HandleAbacateWebhookUseCase
    ) {}

    async handle(req: Request, res: Response): Promise<Response> {
        
        // console.log("[Webhook Payload Bruto]:", JSON.stringify(req.body, null, 2));
        const { 
            event, 
            data 
        }: IWebhookRequest = req.body;

        if (!event || !data) throw new AppError("Erro de integracao com o gateway de pagamento", 400, "INTEGRATION_ERROR");
           
        await this.useCase.execute({
            event,
            data
        });

        // A AbacatePay exige um status HTTP 200 rápido para não tentar reenviar o evento (Backoff)
        return res.status(200).send();
    }
}