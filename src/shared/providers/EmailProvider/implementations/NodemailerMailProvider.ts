import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IMailProvider, ISendMailDTO } from "../interface/IMailProvider.js"

import { SYSTEM_NAME } from "../../../../config/system_data.js";

export class NodemailerMailProvider implements IMailProvider {
    private client: Transporter | null = null;
    
    private async initializeClient(): Promise<void> {
        if (this.client) return; 

        if (process.env.NODE_ENV !== 'production') {
            try {
                const account = await nodemailer.createTestAccount();
                
                this.client = nodemailer.createTransport({
                    host: account.smtp.host,
                    port: account.smtp.port,
                    secure: account.smtp.secure,
                    auth: {
                        user: account.user,
                        pass: account.pass
                    }
                });
            } catch (error) {
                console.error("Erro ao criar conta Ethereal: ", error);
            }
        } else {
            this.client = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
            });
        }
    }

    async sendMail({ to, subject, body }: ISendMailDTO): Promise<void> {
        
        if (!this.client) {
            await this.initializeClient();
        }

        if (!this.client) {
            throw new AppError("Falha ao inicializar serviço de email", 503, "EMAIL_SERVICE_UNAVAILABLE");
        }

        const message = await this.client.sendMail({
            to,
            from: `${SYSTEM_NAME} <noreply@${SYSTEM_NAME}.com.br>`,
            subject,
            html: body 
        });

        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(message));
        }
    }
}