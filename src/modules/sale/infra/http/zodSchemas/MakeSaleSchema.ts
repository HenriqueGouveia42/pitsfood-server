import * as z from "zod";

const PaymentMethodSchema = z.enum(
    ["PIX", "ESPECIE", "CARTAO_DEBITO", "CARTAO_CREDITO"], 
    {
        error: "Método de pagamento inválido. Aceito: PIX, ESPECIE, CARTAO_DEBITO, CARTAO_CREDITO", 
    }
);

const paymentItemSchema = z.object({
    amount: z
        .number({ error: "O valor do pagamento é obrigatório" })
        .positive({ message: "O valor deve ser positivo" }),
    
    method: PaymentMethodSchema
});

const productItemSchema = z.object({
    product_gtin_code: z
        .string({ error: "O código GTIN do produto é obrigatório" })
        .min(1, { message: "GTIN não pode ser vazio" }),

    quantity: z
        .number({ error: "A quantidade é obrigatória" })
        .int({ message: "A quantidade deve ser um número inteiro" })
        .positive({ message: "A quantidade deve ser maior que zero" })
});

export const makeSaleSchema = z.object({
    body: z.object({
        bill_gtin_codes: z
            .array(z.string().min(1, "Código da comanda inválido"))
            .optional(),

        products: z
            .array(productItemSchema)
            .optional(),

        payments: z
            .array(paymentItemSchema, { error: "A lista de pagamentos é obrigatória" })
            .min(1, { message: "Informe ao menos um pagamento" })
    })
    .strict()
    .superRefine((data, ctx) => {
        const hasBills = data.bill_gtin_codes && data.bill_gtin_codes.length > 0;
        const hasProducts = data.products && data.products.length > 0;

        if (!hasBills && !hasProducts) {
            ctx.addIssue({
                code: "custom",
                message: "A venda precisa conter ao menos uma comanda (bill_gtin_codes) ou um produto (products)",
                path: ["products"]
            });
        }
    })
});