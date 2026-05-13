export interface ISendMailDTO {
    to: string | string[]; // Atualizado para suportar múltiplos destinatários
    subject: string;
    body: string; // HTML formatado pelo Use Case
}

export interface IMailProvider {
    sendMail(data: ISendMailDTO): Promise<void>;
}