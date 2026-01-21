import * as z from "zod";

export const CreateProductSchema = z.object({
    body: z.object({
        name: z
            .string({ error: "O nome precisa ser uma string" })
            .min(5, { message: "Nome nao pode ter menos de 5 caracteres" })
            .max(30, { message: "Nome nao pode ter mais de 30 caracteres" }),

        unit_price_in_reais: z
            .string({ error: "O valor em reais precisa ser enviado como uma string" })
            .regex(/^\d+(\.\d{1,2})?$/, { message: "Deve ser um número separado por ponto com no máximo 2 casas decimais" })
            .transform((val) => Number(val))
            .pipe(
                z.number().min(0.1).max(10000)
            ),

        gtin_code: z
            .string()
            .min(8, { message: "GTIN code precisa ter no minino 8 caracteres" })
            .optional(),

        is_internal: z.boolean({ 
            error: "O campo is_internal é obrigatório (true/false)"
        }),

        active: z.boolean().optional()
    })
    .strict()
    .superRefine((data, ctx) => {
        
        // CASO 1: É interno (true) -> PROIBIDO ter GTIN
        if (data.is_internal === true && data.gtin_code) {
            ctx.addIssue({
                code: "custom", // <--- USE "custom" (string) AQUI
                message: "Produtos internos NÃO podem ter código GTIN. Remova o campo gtin_code.",
                path: ["gtin_code"]
            });
        }

        // CASO 2: É externo (false) -> OBRIGATÓRIO ter GTIN
        if (data.is_internal === false && !data.gtin_code) {
            ctx.addIssue({
                code: "custom", // <--- USE "custom" (string) AQUI
                message: "Produtos para venda externa PRECISAM do código GTIN.",
                path: ["gtin_code"]
            });
        }
    })
});