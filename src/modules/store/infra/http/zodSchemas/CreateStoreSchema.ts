/*import { z } from "zod";
import { UserRole } from "../../../entities/user.js"

/*
export enum UserRole {
    GESTOR = "GESTOR",
    CAIXA = "CAIXA",
    VENDEDOR = "VENDEDOR"
}



export const registerEmployeeSchema = z.object({
    body: z.object({
        name: z
            .string({ message: "O nome é obrigatório e deve ser texto" })
            .min(3, { message: "O nome deve ter no mínimo 3 caracteres" }),

        role: z.nativeEnum(UserRole),
        
        plain_text_password: z
            .string({ message: "A senha é obrigatória" })
            .min(6, { message: "A senha deve ter no mínimo 6 caracteres" }),

        email: z
            .email({message: "Email é obrigatorio"})
    })
    .strict()
});


*/

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