import { AppError } from "../../../shared/errors/AppError.js";

/*
    Vamos eliminar as seguintes letras do alfabeto:
    O e Q (parecem zero 0)
    I (parece um 1)
    Z (parece um 2)
    S (parece um 5)
    B (parece um 8)
*/
export const VALID_LETTERS = "ACDEFGHJKLMNPRTUVWXY";
export const PHYSICAL_BILL_CODE_LENGHT: number = 4

export function calculateCheckLetter(sequence: string): string {
    const sum: number =
        (Number(sequence[0]) * 3) + 
        (Number(sequence[1]) * 5) + 
        (Number(sequence[2]) * 7);

    const letterIndex: number = sum % VALID_LETTERS.length;
    const checkLetter: string | undefined = VALID_LETTERS[letterIndex];
    
    if(!checkLetter) throw new AppError("Caractere de verificação invalido");
    
    return checkLetter;
}

export function generateValid4DigitsPhysicalCodes(quantity: number): Set<string> {
    
    if (quantity > 999) {
        throw new AppError("A quantidade máxima não pode exceder 999", 422, "MAX_BILLS_EXCEEDED");
    }

    const codes = new Set<string>();

    for (let i = 1; i <= quantity; i++) {
        const sequence = i.toString().padStart(3, '0');
        
        const checkLetter: string = calculateCheckLetter(sequence);
        
        codes.add(`${sequence}${checkLetter}`);
    }

    return codes;
}