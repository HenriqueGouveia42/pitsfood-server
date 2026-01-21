import { z } from "zod";

export const loginSchema = z.object({
    body: z.object({
        username: z
            .string({ error: "O username é obrigatório" })
            .min(1, { message: "O username não pode estar vazio" }),

        password: z
            .string({ error: "A senha é obrigatória" })
            .min(1, { message: "A senha não pode estar vazia" })
    })
    .strict() // Segurança: não aceita campos extras (ex: tentar injetar "isAdmin": true)
});