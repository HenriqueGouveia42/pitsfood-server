import { z } from "zod";

export const createUserSchema = z.object({
    body: z.object({
        name: z
            .string({ message: "O nome é obrigatório e deve ser texto" })
            .min(3, { message: "O nome deve ter no mínimo 3 caracteres" }),

        role: z.enum(["CAIXA", "GESTOR", "VENDEDOR"], {
            message: "Role inválido. Permitidos: CAIXA, GESTOR, VENDEDOR"
        }),

        plain_text_password: z
            .string({ message: "A senha é obrigatória" })
            .min(6, { message: "A senha deve ter no mínimo 6 caracteres" })
    })
    .strict()
});