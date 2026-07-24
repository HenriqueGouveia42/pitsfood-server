export interface ICreateTransparentPixDTO {
    amount: number; 
    description: string;
    expiresIn: number; 
    customer: {
        name: string;
        email: string;
        taxId: string;
        cellphone: string;
    };
    metadata?: Record<string, any>; 
}

export interface ITransparentPixResponse {
    id: string;
    amount: number;
    status: string;
    brCode: string;
    brCodeBase64: string;
    expiresAt: string;
}

export interface IPaymentProvider {
    createTransparentPix(data: ICreateTransparentPixDTO): Promise<ITransparentPixResponse>;
    simulateTransparentPix(id: string): Promise<boolean>;
}