export interface ISendMailDTO {
    to: string;
    subject: string;
    body: string; // aqui vai HTML formatado pelo Use Case
}

export interface IMailProvider {
    sendMail(data: ISendMailDTO): Promise<void>;
}