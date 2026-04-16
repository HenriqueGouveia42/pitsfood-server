import type { IStagedUserSendEmail } from "../staged.user.send.email.interface.js";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { AppError } from "../../../../shared/errors/AppError.js";

export class StagedUserNodeMailerSendEmail implements IStagedUserSendEmail{

    private client: Transporter | null = null;
    
    private async initializeClient(): Promise<void>{

        if(this.client) return; //se ja foi inicializado antes nao faz nada

        if (process.env.NODE_ENV !== 'production'){ //ambiente de dev

            try{

                const account = await nodemailer.createTestAccount();
                
                this.client = nodemailer.createTransport({
                    host: account.smtp.host,
                    port: account.smtp.port,
                    secure: account.smtp.secure,
                    auth: {
                        user: account.user,
                        pass: account.pass
                    }
                })

            }catch(error){
                console.error("Erro ao criar conta Ethereal: ", error)
            }
        } else {

            //ambiente de producao

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

    async sendVerificationCodeToEmail(email: string, verificationCode: string): Promise<void> {
        
        if(!this.client){ //garante que o cliente existe
            await this.initializeClient();
        }

        if(!this.client){
            throw new AppError("Falha ao inicializar serviço de email", 503, "EMAIL_SERVICE_UNAVAILABLE" )
        }

        const message = await this.client.sendMail({
            to: email,
            from: "Manga Food <noreply@pitstop.com.br>",
            subject: "Seu código de verificação de sua nova conta Manga Food",
            text: `Seu codigo de verificacao: ${verificationCode}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Bem-vindo à Manga Food!</h2>
                    <p>Use o código abaixo para validar seu cadastro:</p>
                    <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; width: fit-content;">
                        <strong style="font-size: 24px; letter-spacing: 3px;">${verificationCode}</strong>
                    </div>
                    <p><small>Este código expira em 15 minutos.</small></p>
                </div>
            `
        });

        if (process.env.NODE_ENV !== 'production'){ //ver o email fake no terminal se for ambiente de producao
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(message));
        }
    }
}