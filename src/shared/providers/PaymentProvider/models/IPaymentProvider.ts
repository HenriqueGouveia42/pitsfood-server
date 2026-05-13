export interface ICreateCustomerDTO {
    name: string;
    email: string;
    taxId: string; //CPF ou CNPJ
    cellphone: string;
}

export interface ICreatePaymentDTO {
    customerId: string;
    amount_in_cents: number;
    description: string;
    dueDate: Date;
}

export interface IPaymentResponse {
    payment_id: string;//ID interno do gateway (ex: bill_123)
    payment_url: string;//URL para pagamento
    status: string;
}

export interface IPaymentProvider {
    createCustomer(data: ICreateCustomerDTO): Promise<string>; //Retorna o ID do cliente no Gateway
    createPixPayment(data: ICreatePaymentDTO): Promise<IPaymentResponse>;
}