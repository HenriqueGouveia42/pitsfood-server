import type { Request, Response } from "express";
import { HandleAbacateWebhookUseCase } from "./HandleAbacateWebhookUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IWebhookRequest } from "./HandleAbacateWebhookUseCase.js";

/*
    Exemplo do Novo Payload de Webhook da v2 (transparent.completed):
   {
  "event": "transparent.completed",
  "apiVersion": 2,
  "devMode": true,
  "data": {
    "transparent": {
      "id": "pix_char_wrq3UMAU0CWGYmH5ngyjpMjc",
      "externalId": null,
      "amount": 13900,
      "paidAmount": null,
      "platformFee": 80,
      "status": "PAID",
      "items": [],
      "methods": [],
      "frequency": "ONE_TIME",
      "coupons": [],
      "devMode": true,
      "customerId": "cust_0EP5gUXkM0TmQeCq1d5gLG2J",
      "createdAt": "2026-06-15T11:41:14.781Z",
      "updatedAt": "2026-06-15T11:41:23.828Z",
      "receiptUrl": null,
      "metadata": {
        "internal_invoice_id": "292a7a10-de81-486e-a452-a88fa2703cad"
      }
    },
    "customer": {
      "id": "cust_0EP5gUXkM0TmQeCq1d5gLG2J",
      "name": "Henrique Gouveia",
      "email": "henriquesgo42@gmail.com",
      "taxId": "119.***.624-**"
    },
    "payerInformation": {
      "method": "PIX",
      "utms": {
        "source": null,
        "medium": null,
        "campaign": null,
        "term": null,
        "content": null
      },
      "PIX": {
        "name": "Henrique Gouveia",
        "taxId": "119.***.624-**",
        "isSameAsCustomer": true
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