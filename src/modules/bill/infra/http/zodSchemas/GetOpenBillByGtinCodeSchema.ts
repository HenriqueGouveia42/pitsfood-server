import * as z from "zod"

export const GetOpenBillByGtinCodeSchema = z.object({
    params: z.object({
        bill_code_gtin: z
        .string({error: "Codigo da comanda precisa ser string"})
        .length(4, {error: "Codigo da comanda precisa ter 4 digitios"})
        .regex(/^\d+$/, { error: "O código deve conter apenas números" })
    }).strict()
})