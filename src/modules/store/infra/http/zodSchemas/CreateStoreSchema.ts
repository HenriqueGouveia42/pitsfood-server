import { z } from "zod";

export const createStoreSchema = z.object({
    body: z.object({

        name: z
            .string({message: "Nome da loja precisa ser uma string"})
            .min(5, {message: "Nome da loja precisa ter ao menos 5 caracteres"}),

        cnpj: z
            .string({message: "CNPJ precisa ser uma string"})
            .min(5, {message: "CNPJ com poucos digitos"})
            .nullable(),

    }).strict()
})