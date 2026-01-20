import * as z from "zod";

export const billCodeExistsSchema = z.object({
    params: z.object({
        bill_code_gtin: z
        .string({error: "O codigo é obrigatorio"})
        .length(4, {error: "O codigo deve ter exatamente 4 digitos"})
        .regex(/^\d+$/, { error: "O código deve conter apenas números" })
    }).strict()
})