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
            .string({ message: "Email é obrigatorio" })
            .email({ message: "Formato de email inválido" }),
        
        // Deixamos a base opcional/nullable para passar pelo Zod inicialmente
        cpf_cnpj: z
            .string({ message: "Precisa ser string" })
            .min(11, { message: "Precisa ter no minimo 11 digitos" })
            .nullable()
            .optional(),
        
        // Ajustei para nullable/optional para refletir o contrato do Controller (string | null)
        phone: z
            .string({ message: "Precisa ser string" })
            .max(20, { message: "Maximo de 20 caracteres" })
            .nullable()
            .optional()
    })
    .strict()
    // Regra de negócio condicional
    .superRefine((data, ctx) => {
        // Verifica se é Gestor e se o CPF está ausente ou vazio
        if (data.role === UserRole.GESTOR && (!data.cpf_cnpj || data.cpf_cnpj.trim() === '')) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "O CPF/CNPJ é obrigatório para o cargo de Gestor",
                path: ["cpf_cnpj"], // Anexa o erro diretamente ao path do cpf_cnpj
            });
        }
    })
});