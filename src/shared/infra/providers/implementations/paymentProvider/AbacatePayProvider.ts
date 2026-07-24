import axios, { type AxiosInstance } from "axios";
import { AppError } from "../../../../errors/AppError.js";

import type { 
    IPaymentProvider,
    ICreateTransparentPixDTO, 
    ITransparentPixResponse 
 } from "../../../../providers/interfaces/paymentProvider/IPaymentProvider.js";

export class AbacatePayProvider implements IPaymentProvider {
    private api: AxiosInstance;

    constructor() {

        const apiToken = process.env.ABACATE_PAY_API_TOKEN_V2;

        this.api = axios.create({
            baseURL: "https://api.abacatepay.com/v2", // Atualizado para a v2
            headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });
    }

    async createTransparentPix(data: ICreateTransparentPixDTO): Promise<ITransparentPixResponse> {
        try {
            // 1. HIGIENIZAÇÃO DE DADOS
            const cleanTaxId = data.customer.taxId.replace(/\D/g, "");
            const cleanPhone = data.customer.cellphone.replace(/\D/g, "");

            // 2. MONTAGEM DO PAYLOAD DA V2
            const payload = {
                method: "PIX",
                data: {
                    amount: data.amount,
                    description: data.description,
                    expiresIn: data.expiresIn,
                    customer: {
                        name: data.customer.name,
                        email: data.customer.email,
                        taxId: cleanTaxId,
                        cellphone: cleanPhone
                    },
                    metadata: data.metadata
                }
            };

            // 3. REQUISIÇÃO
            const response = await this.api.post("/transparents/create", payload);

            // 4. VALIDAÇÃO ESTRITA DA NOVA API (Obrigatório checar 'success')
            if (!response.data || response.data.success === false) {
                throw new Error(response.data?.error || "A API retornou success: false sem mensagem de erro detalhada.");
            }

            const responseData = response.data.data;

            // Prevenção de nulos caso o gateway mude silenciosamente
            if (!responseData || !responseData.brCode || !responseData.brCodeBase64) {
                throw new Error("A API retornou sucesso, mas os dados do QR Code (brCode/brCodeBase64) estão ausentes.");
            }

            return {
                id: responseData.id,
                amount: responseData.amount,
                status: responseData.status,
                brCode: responseData.brCode,
                brCodeBase64: responseData.brCodeBase64,
                expiresAt: responseData.expiresAt
            };

        } catch (error: any) {
            const isProduction: boolean = process.env.NODE_ENV === 'production';
            
            if (!isProduction) {
                const errorData = error.response?.data || error.message;
                console.error("[AbacatePay] Erro CreateTransparentPix:", JSON.stringify(errorData, null, 2));
            }
            
            throw new AppError("Erro ao gerar PIX transparente no gateway de pagamento", 502, "GATEWAY_ERROR");
        }
    }

    async simulateTransparentPix(id: string): Promise<boolean> {
        try {
            const cleanId = id.trim();

            // CORREÇÃO DEFINITIVA: Injetando o ID diretamente na URL (Query String manual)
            // Isso força o Axios a enviar o parâmetro sem depender do objeto de 'params'
            const endpoint = `/transparents/simulate-payment?id=${cleanId}`;

            const response = await this.api.post(endpoint, {});

            if (!response.data || response.data.success === false) {
                throw new Error(response.data?.error || "A API de simulação retornou falha.");
            }

            return response.data.success;
        } catch (error: any) {
            const errorData = error.response?.data || error.message;
            console.error("\n[AbacatePay DEBUG] Erro detalhado na simulação:", JSON.stringify(errorData, null, 2));
            console.error("[AbacatePay DEBUG] ID enviado para simulação:", id, "\n");

            throw new AppError("Erro ao processar simulação no gateway", 502, "GATEWAY_ERROR");
        }
    }
}