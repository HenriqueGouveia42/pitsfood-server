export interface ICreateTransparentPixDTO {
    amount: number; // Valor em centavos
    description: string;
    expiresIn: number; // Tempo de expiração em segundos (ex: 86400 para 24h)
    customer: {
        name: string;
        email: string;
        taxId: string; // CPF ou CNPJ
        cellphone: string;
    };
    metadata?: Record<string, any>; // Usaremos para injetar o seu invoice_id
}

export interface ITransparentPixResponse {
    id: string; // ID da transação no gateway (ex: pix_char_abc123)
    amount: number;
    status: string;
    brCode: string; // O famoso "Copia e Cola"
    brCodeBase64: string; // Imagem do QR Code para o front-end
    expiresAt: string;
}

export interface IPaymentProvider {
    createTransparentPix(data: ICreateTransparentPixDTO): Promise<ITransparentPixResponse>;
    simulateTransparentPix(id: string): Promise<boolean>;
}