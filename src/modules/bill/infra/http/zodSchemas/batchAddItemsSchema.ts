import * as z from "zod";

const itemSchema = z.object({
    product_gtin_code: z
    .string({error: "GTIN code precisa ser uma string"})
    .min(8, {error: "GTIN code precisa ter no minino 8 caracteres"}),

    quantity: z
    .number({error: "quantity precisa ser um número"})
    .min(1, {error: "quantity precisa ser no minimo 1"})
    .max(1000, {error: "quantity pode ser no maximo 1000"})

}).strict();

export const batchAddItemsSchema = z.object({
    body: z.object({
        bill_code: z
        .string({error: "Codigo da comanda precisa ser uma string"})
        .length(4, {error: "Codigo da comanda precisa ser de 4 numeros"}),

        items: z
        .array(itemSchema, {error: "Itens em formato incorreto"})
        .min(1, "A lista de itens nao pode estar vazia")
    }).strict()
})

