import { Resend } from "resend";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IMailProvider, ISendMailDTO } from "../interface/IMailProvider.js";
import { SYSTEM_NAME, SYSTEM_NAME_DIMINUTIVE } from "../../../../config/system_data.js";

export class ResendMailProvider implements IMailProvider {
    private client: Resend;

    constructor() {
        if (!process.env.RESEND_API_KEY) {
            throw new AppError("Chave de API do Resend não configurada", 500, "MISSING_API_KEY");
        }
        
        this.client = new Resend(process.env.RESEND_API_KEY);
    }

    async sendMail({ to, subject, body }: ISendMailDTO): Promise<void> {
        try {
            const { data, error } = await this.client.emails.send({
                // O domínio aqui DEVE estar verificado no painel do Resend
                from: `${SYSTEM_NAME} <nao-responda@${SYSTEM_NAME_DIMINUTIVE}.com>`, 
                to: [to],
                subject,
                html: body,
            });

            if (error) {
                console.error("Erro da API do Resend:", error);
                throw new AppError("Falha ao enviar email pelo Resend", 502, "EMAIL_DELIVERY_FAILED");
            }

            if (process.env.NODE_ENV !== 'production') {
                console.log(`[Resend] Email enviado com sucesso. ID: ${data?.id}`);
            }

        } catch (error) {
            if (error instanceof AppError) throw error;
            
            console.error("Exceção ao disparar email:", error);
            throw new AppError("Falha interna ao disparar email", 500, "INTERNAL_EMAIL_ERROR");
        }
    }
}