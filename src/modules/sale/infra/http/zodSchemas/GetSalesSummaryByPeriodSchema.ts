import * as z from "zod";

export const getSalesSummarySchema = z.object({
    // Validamos 'query' pois os dados vêm da URL (?startDate=...&endDate=...)
    query: z.object({
        startDate: z.coerce.date({
            error: "O parâmetro 'startDate' é obrigatório",
        }),

        endDate: z.coerce.date({
            error: "O parâmetro 'endDate' é obrigatório",
        })
    })
    .strict()
    .refine((data) => data.endDate >= data.startDate, {
        message: "A data final (endDate) deve ser maior ou igual à data inicial (startDate)",
        path: ["endDate"]
    })
});