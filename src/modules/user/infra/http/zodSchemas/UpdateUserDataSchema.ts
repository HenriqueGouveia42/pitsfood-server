import { z } from "zod";

export const updateUserDataSchema = z.object({
    // 1. Validação dos parâmetros de rota (URL)
    params: z.object({
        id: z
            .string({ error: "O ID do usuário é obrigatório na URL" })
            .min(1, { message: "ID inválido" })
            // Se o ID for UUID, você pode adicionar .uuid({ message: "ID inválido" })
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
    
    //regra de Negócio: Impedir requisição vazia
    .refine((data) => {
        //verifica se pelo menos um dos campos foi enviado
        return data.name !== undefined || data.password !== undefined || data.active !== undefined;
    }, {
        message: "É necessário enviar ao menos um campo para atualização (name, password ou active)",
        path: [] //O erro será associado ao objeto body em geral
    })
});