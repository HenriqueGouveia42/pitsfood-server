import { z } from "zod";

export const updateUserDataSchema = z.object({
    // 1. Validação dos parâmetros de rota (URL)
    params: z.object({
        // CORREÇÃO AQUI: Mudamos de 'id' para 'target_user_id'
        target_user_id: z
            .string({ error: "O ID do usuário é obrigatório na URL" })
            .uuid({ message: "ID inválido (deve ser um UUID)" }) // Recomendado se usa UUID
            .min(1, { message: "ID inválido" })
    }).strict(),

    // 2. Validação do corpo da requisição
    body: z.object({
        name: z
            .string({ error: "O nome deve ser uma string" })
            .min(3, { message: "O nome deve ter no mínimo 3 caracteres" })
            .optional(),

        password: z
            .string({ error: "A senha deve ser uma string" })
            .min(6, { message: "A senha deve ter no mínimo 6 caracteres" })
            .optional(),

        active: z
            .boolean({ error: "O campo active deve ser true ou false" })
            .optional()
    })
    .strict()
    
    //impedir requisição vazia (body {})
    .refine((data) => {
        return data.name !== undefined || data.password !== undefined || data.active !== undefined;
    }, {
        message: "É necessário enviar ao menos um campo para atualização (name, password ou active)",
        path: [] //erro será associado ao objeto body raiz
    })
});