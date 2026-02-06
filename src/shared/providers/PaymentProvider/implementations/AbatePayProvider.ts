import axios, { type AxiosInstance } from "axios";
import { AppError } from "../../../errors/AppError.js";

import type { 
    IPaymentProvider, 
    ICreateCustomerDTO, 
    ICreatePaymentDTO, 
    IPaymentResponse 
} from "../models/IPaymentProvider.js";

export class AbacatePayProvider implements IPaymentProvider {

    private api: AxiosInstance;

    constructor() {
        const apiToken = process.env.ABACATE_PAY_API_TOKEN;

        this.api = axios.create({
            baseURL: "https://api.abacatepay.com/v1",
            headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });
    }

    async createCustomer({ name, email, taxId, cellphone }: ICreateCustomerDTO): Promise<string> {
        try {
            // ---------------------------------------------------------
            // 1. TENTATIVA DE LISTAR (Evita criar duplicado)
            // ---------------------------------------------------------
            // A API do AbacatePay pode retornar erro ou null se tentarmos criar
            // um cliente que já existe. Por isso, buscamos antes.
            
            try {
                const listResponse = await this.api.get("/customer/list", {
                    params: { email: email }
                });

                // Se a lista retornou dados e tem pelo menos um cliente, usamos esse ID
                if (listResponse.data?.data && Array.isArray(listResponse.data.data)) {
                    const existingCustomer = listResponse.data.data.find((c: any) => c.email === email);
                    if (existingCustomer) {
                        console.log(`[AbacatePay] Cliente já existente encontrado: ${existingCustomer.id}`);
                        return existingCustomer.id;
                    }
                }
            } catch (err) {
                // Se der erro ao listar, apenas ignoramos e tentamos criar.
                console.warn("[AbacatePay] Aviso: Não foi possível listar clientes, tentando criar novo.");
            }

            // ---------------------------------------------------------
            // 2. HIGIENIZAÇÃO DE DADOS (Remove pontuação)
            // ---------------------------------------------------------
            // Remove tudo que não for número do CPF e Telefone
            const cleanTaxId = taxId ? taxId.replace(/\D/g, "") : undefined;
            const cleanPhone = cellphone ? cellphone.replace(/\D/g, "") : undefined;

            console.log(`[AbacatePay] Criando cliente: ${email} | CPF Limpo: ${cleanTaxId}`);

            // ---------------------------------------------------------
            // 3. CRIAÇÃO DO CLIENTE
            // ---------------------------------------------------------
            const response = await this.api.post("/customer/create", {
                name,
                email,
                taxId: cleanTaxId, 
                cellphone: cleanPhone
            });

            // Proteção contra retorno nulo da API (A causa do seu erro)
            if (!response.data || !response.data.data || !response.data.data.id) {
                console.error("[AbacatePay] Resposta inesperada da API:", JSON.stringify(response.data, null, 2));
                throw new Error("A API retornou sucesso (200) mas não enviou o ID do cliente.");
            }

            return response.data.data.id;

        } catch (error: any) {
            // Logs detalhados para você ver no terminal o motivo real
            const errorData = error.response?.data || error.message;
            console.error("Erro AbacatePay CreateCustomer:", JSON.stringify(errorData, null, 2));
            
            throw new AppError("Erro ao registrar cliente no gateway de pagamento", 502, "GATEWAY_ERROR");
        }
    }

    async createPixPayment({ customerId, amount_in_cents, description, dueDate }: ICreatePaymentDTO): Promise<IPaymentResponse> {
        try {
            // Validação básica
            if (!customerId) throw new AppError("ID do cliente é obrigatório para gerar PIX", 400);

            console.log(`[AbacatePay] Gerando Billing para Customer: ${customerId}, Valor: ${amount_in_cents}`);

            const response = await this.api.post("/billing/create", {
                frequency: "ONE_TIME",
                methods: ["PIX"],
                customerId: customerId,
                returnUrl: `${process.env.APP_URL}/payment/success`, // Ajuste conforme sua rota real
                completionUrl: `${process.env.APP_URL}/payment/completed`,
                products: [
                    {
                        externalId: `sub-prorata-${Date.now()}`,
                        name: "Assinatura Proporcional (Pitstop)",
                        description: description || "Assinatura do sistema",
                        quantity: 1,
                        price: amount_in_cents
                    }
                ]
            });

            if (!response.data?.data?.url) {
                console.error("[AbacatePay] Erro ao criar billing. Resposta sem URL:", response.data);
                throw new Error("URL de pagamento não foi gerada pela API.");
            }

            return {
                payment_id: response.data.data.id,
                payment_url: response.data.data.url,
                status: response.data.data.status
            };

        } catch (error: any) {
            const errorData = error.response?.data || error.message;
            console.error("Erro AbacatePay CreateBilling:", JSON.stringify(errorData, null, 2));
            throw new AppError("Erro ao gerar cobrança PIX", 502, "GATEWAY_ERROR");
        }
    }
}