import { z } from "zod";
import { UserRole } from "../../../entities/user.js"

/*
export enum UserRole {
    GESTOR = "GESTOR",
    CAIXA = "CAIXA",
    VENDEDOR = "VENDEDOR"
}

*/

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
            .email({message: "Email é obrigatorio"}),
        cpf_cnpj : z
            .string( { message: "Precisa ser string" })
            .min(11, { message: "Precisa ter no minimo 11 digitos"}),
        
        phone: z
            .string( { message: "Precisa ser string" })
            .max(20, { message: "Maximo de 20 caracteres" })
    })
    .strict()
});