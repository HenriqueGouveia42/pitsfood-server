import { Resend } from "resend";
import { AppError } from "../../../../errors/AppError.js";
import type { IMailProvider, ISendMailDTO } from "../../../../providers/interfaces/emailProvider/IMailProvider.js";
import { SYSTEM_NAME, SYSTEM_NAME_DIMINUTIVE } from "../../../../../config/system_data.js";

export class ResendMailProvider implements IMailProvider {
    private client: Resend;

    constructor() {
        const apiKey = process.env.RESEND_API_KEY;
        
        if (!apiKey) {
            throw new AppError("Chave de API do Resend não configurada", 500, "MISSING_API_KEY");
        }
        
        this.client = new Resend(apiKey);
    }

    async sendMail({ to, subject, body }: ISendMailDTO): Promise<void> {
        try {
            // Garante que o formato seja sempre um array, atendendo à flexibilidade do DTO
            const recipients = Array.isArray(to) ? to : [to];

            const { data, error } = await this.client.emails.send({
                // O domínio aqui DEVE estar verificado no painel do Resend
                from: "naoresponda@confirmation.pitsfood.com", 
                to: recipients,
                subject,
                html: body,
            });

            // O tratamento nativo do erro da API do Resend
            if (error) {
                console.error("Erro da API do Resend:", error);
                // 502 Bad Gateway é adequado aqui pois a falha veio de um serviço "upstream"
                throw new AppError("Falha ao enviar email pelo Resend", 502, "EMAIL_DELIVERY_FAILED"); 
            }

            if (process.env.NODE_ENV !== 'production') {
                console.log(`[Resend] Email enviado com sucesso. ID: ${data?.id}`);
            }

        } catch (error) {
            // Se o erro já for um AppError (lançado pelo bloco acima), apenas repassamos
            if (error instanceof AppError) throw error;
            
            // Captura erros de infraestrutura (timeout, indisponibilidade de rede, etc.)
            console.error("Exceção ao disparar email:", error);
            throw new AppError("Falha interna ao disparar email", 500, "INTERNAL_EMAIL_ERROR");
        }
    }
}