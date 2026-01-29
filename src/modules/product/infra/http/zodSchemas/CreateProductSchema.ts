import * as z from "zod";

export const CreateProductSchema = z.object({
    body: z.object({
        name: z
            .string({ error: "Nome é obrigatório" })
            .trim()
            .min(3, { message: "Nome muito curto (mínimo 3 letras)" }) // Ajustado para ser mais realista
            .max(100, { message: "Nome muito longo (máximo 100 letras)" }), // Ajustado conforme entidades anteriores

        // Aceita string ("10.50") ou number (10.50) e converte para Number
        unit_price_in_reais: z
            .union([z.string(), z.number()])
            .transform((val) => Number(val))
            .refine((val) => !isNaN(val) && val >= 0, { message: "Preço inválido ou negativo" }),

        gtin_code: z
            .string()
            .trim()
            .min(8, { message: "GTIN deve ter no mínimo 8 dígitos" })
            .nullable()
            .optional(),

        is_internal: z.boolean({ error: "Defina se o produto é interno ou externo" }),

        active: z.boolean().default(true),

        requires_preparation: z.boolean().default(false), 

        track_stock: z.boolean({ error: "Defina se controla estoque" }),
        
        //preprocess: Se vier null, undefined ou string vazia, vira 0.
        // coerce: Se vier string "10", vira number 10.
        stock_quantity: z.preprocess(
            (val) => {
                if (val === null || val === undefined || val === "") return 0;
                return val;
            },
            z.coerce.number({ error: "Quantidade de estoque inválida" }).int()
        )
    })
    .strict() //impede campos "lixo" não mapeados
    .superRefine((data, ctx) => {
        
        //caso 1: produto Interno -> Não deve ter GTIN (ou ignora-se)
        //regra de negócio: Se é interno, geralmente geramos ID automático, então gtin deve ser nulo/vazio
        if (data.is_internal === true && data.gtin_code) {
            ctx.addIssue({
                code: "custom",
                message: "Produtos internos não devem ter GTIN informado manualmente (será gerado '22...').",
                path: ["gtin_code"]
            });
        }

        //caso 2: Produto Externo -> GTIN Obrigatório
        if (data.is_internal === false && !data.gtin_code) {
            ctx.addIssue({
                code: "custom",
                message: "Produtos externos (venda) precisam ter o código de barras (GTIN/EAN).",
                path: ["gtin_code"]
            });
        }
    })
});