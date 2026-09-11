import * as z from "zod";
import { VALID_LETTERS } from "../../../functions/GenerateValidPhysicalBillCodes.js";

const billCodeRegex: RegExp = new RegExp(`^\\d{3}[${VALID_LETTERS}]$`, "i");

export const billCodeExistsSchema = z.object({
    params: z.object({
        bill_code_gtin: z
        .string({ error: "O codigo é obrigatorio" })
        .length(4, { message: "O codigo deve ter exatamente 4 caracteres" })
        .regex(billCodeRegex, { 
            message: "O código deve conter 3 números seguidos de uma letra verificadora válida" 
        })
    }).strict()
});