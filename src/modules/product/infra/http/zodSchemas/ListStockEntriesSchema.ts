import * as z from "zod";

export const ListStockEntriesSchema = z.object({
    // rotas GET, validamos o 'query' (Query Params da URL) e não o 'body'
    query: z.object({
        page: z
            .string({ error: "O parâmetro page deve ser uma string" })
            .trim()
            .regex(/^\d+$/, { message: "A página deve conter apenas números positivos" }) // Garante que é numérico "1", "20"
            .optional() // se não enviar, o controller assume 1
            .nullable()
            // opcional: garantir que não mandem "0" (já que página começa em 1)
            .refine((val) => {
                if (!val) return true; // Se for undefined/null/vazio passa
                return parseInt(val) > 0;
            }, { message: "A página deve ser maior que 0" }),

        // NOVO PARÂMETRO OPCIONAL
        product_id: z
            .string({ error: "O ID do produto deve ser texto" })
            .trim()
            .uuid({ message: "O ID do produto informado inválido (deve ser um UUID)" }) // Validação extra de segurança
            .optional()
            .nullable()
    })
    .strict() // impede envio de parâmetros "lixo" na URL, mas agora aceita 'page' e 'product_id'
});