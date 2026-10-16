import { z } from "zod";

const itemSchema = z.object({
    product_gtin: z
        .string({
            error: (issue) => issue.input === undefined ? "GTIN code é obrigatório" : "GTIN code precisa ser uma string"
        })
        .min(8, { error: "GTIN code precisa ter no minino 8 caracteres" }),

    quantity: z
        .number({
            error: (issue) => issue.input === undefined ? "Quantidade é obrigatória" : "quantity precisa ser um número"
        })
        .min(1, { error: "quantity precisa ser no minimo 1" })
        .max(1000, { error: "quantity pode ser no maximo 1000" })

}).strict();

export const batchAddItemsSchema = z.object({
    body: z.object({
        bill_code_gtin: z
            .string({
                error: (issue) => issue.input === undefined ? "Codigo da comanda é obrigatório" : "Codigo da comanda precisa ser uma string"
            })
            .length(4, { error: "Codigo da comanda precisa ser de 4 numeros" }),

        products_gtins_quantities: z
            .array(itemSchema, {
                error: (issue) => issue.input === undefined ? "A lista de produtos é obrigatória" : "Itens em formato incorreto"
            })
            .min(1, { error: "A lista de itens nao pode estar vazia" })
    }).strict()
});