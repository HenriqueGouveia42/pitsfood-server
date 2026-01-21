import { z } from "zod";

export const getUsersDataSchema = z.object({
    query: z.object({
        active: z.enum(["true", "false"], {
            message: "O parâmetro 'active' deve ser 'true' ou 'false'"
        })
        .optional() // É opcional (pode ser undefined)
       
        .transform((val) => val === "true")
    })
    .strict() //rejeita parâmetros estranhos na URL (ex: ?batata=123)
});