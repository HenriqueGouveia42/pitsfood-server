import type { Request, Response } from "express";
import { HandleAbacateWebhookUseCase } from "./HandleAbacateWebhookUseCase.js";

export class HandleAbacateWebhookController {
    
    constructor(
        private useCase: HandleAbacateWebhookUseCase
    ) {}

    async handle(req: Request, res: Response): Promise<Response> {
        
        
        // estrutura esperada: { event: "billing.paid", data: { ... } } a ser enviada pelo AbacatePay
        const { event, data } = req.body;

        //logs de entrada para debugar webhooks em produção
        // onsole.log("Webhook payload received:", JSON.stringify(req.body, null, 2));

        if (!event || !data) {
            //se o payload vier vazio ou mal formatado, retornamos 400 para indicar erro de integração
            //mas cuidado: alguns gateways ficam tentando reenviar se receberem 400.
            return res.status(400).send();
        }

        await this.useCase.execute({
            event,
            data
        });

        // Retornamos 200 OK para confirmar o recebimento
        return res.status(200).send();
    }
}