import { AppError } from "../../../shared/errors/AppError.js";

export function generateValid4DigitsPhysicalCodes(quantity: number): Set<string>{

    let codes = new Set<string>();
    const max_attempts: number = 20 * quantity;
    let attempts: number = 0;

    while ((codes.size < quantity) && attempts < max_attempts){

        attempts++

        let sum: number = 0;
        let impar: boolean = true;
        let code: string = "";

        for (let j = 0; j < 3; j++){

            let code_digit: number;

            if (j === 0) {
                // Primeiro dígito: 1 a 9 (não pode ser 0)
                code_digit = Math.floor(Math.random() * 9) + 1;
            } else {
                // Segundo e terceiro dígitos: 0 a 9 (pode ser 0)
                code_digit = Math.floor(Math.random() * 10);
            }

            impar ?
                sum += code_digit
                :
                sum += 3 * code_digit
            impar = !impar

            code += code_digit.toString();

        }
        
        const verifier_digit: number = (10 - (sum % 10)) % 10
        code += verifier_digit;
        
        codes.add(code);
    }

    if (codes.size < quantity) throw new AppError("Muitas tentativas de criar comandas físicas", 422, "MAX_ATTEMPTS_REACHED")
    
    return codes;
}