import { z } from "zod";

// Usando apenas "error" ou "message" conforme a nova API do Zod v4
const PaymentMethodSchema = z.enum(
    ["PIX", "ESPECIE", "CARTAO_DEBITO", "CARTAO_CREDITO"], 
    {
        error: "Método de pagamento inválido. Aceitos: PIX, ESPECIE, CARTAO_DEBITO, CARTAO_CREDITO"
    }
);

const paymentItemSchema = z.object({
    // Usa coerce para transformar string "15.50" em número 15.5
    amount: z.coerce
        .number({ 
            error: "O valor do pagamento é obrigatório e deve ser numérico" 
        })
        .positive({ message: "O valor deve ser positivo (maior que zero)" }),
    
    method: PaymentMethodSchema
});

export const makeSaleSchema = z.object({
    body: z.object({
        
        bill_physical_codes: z
            .array(
                z.string({ error: "O código da comanda deve ser um texto" })
                 .min(1, { message: "Código da comanda não pode ser vazio" })
            )
            .optional(),

        products_gtin_codes: z
            .array(
                z.string({ error: "O código do produto deve ser um texto" })
                 .min(1, { message: "O código do produto não pode ser vazio" })
            )
            .optional(),

        payments: z
            .array(paymentItemSchema, { 
                error: "A lista de pagamentos é obrigatória e deve estar no formato correto"
            })
            .min(1, { message: "Informe ao menos um método de pagamento" })
            
    })
    .strict()
    .superRefine((data, ctx) => {
        // Validação de Negócio: Não existe venda vazia
        const hasBills = data.bill_physical_codes && data.bill_physical_codes.length > 0;
        const hasProducts = data.products_gtin_codes && data.products_gtin_codes.length > 0;

        if (!hasBills && !hasProducts) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "A venda precisa conter ao menos uma comanda (bill_physical_codes) ou um produto avulso (products_gtin_codes)",
                path: ["products_gtin_codes"] // Indica o caminho do erro para o Front-end
            });
        }
    })
});