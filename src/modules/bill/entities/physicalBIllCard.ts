import { AppError } from "../../../shared/errors/AppError.js";
import { VALID_LETTERS, PHYSICAL_BILL_CODE_LENGHT, calculateCheckLetter } from "../functions/GenerateValidPhysicalBillCodes.js";

export type PhysicalBillProps = {
    id: string,
    code: string,
    store_id: string,
    is_lost: boolean,
    created_at: string,
    updated_at: string
}

export class PhysicalBill {

    private constructor(private readonly props: PhysicalBillProps) {}

    private static validatePhysicalBillCode(code: string): void {
        
        if (code.length !== PHYSICAL_BILL_CODE_LENGHT) {
            throw new AppError("Código precisa ter exatamente 4 caracteres", 422, "INVALID_CODE_LENGTH");
        }

        const sequence: string = code.slice(0, 3);
        const checkLetter: string = code.slice(3).toUpperCase();

        if (!/^\d{3}$/.test(sequence)) {
            throw new AppError("Os três primeiros caracteres devem ser numéricos", 422, "INVALID_CODE_FORMAT");
        }

        if (!VALID_LETTERS.includes(checkLetter)) {
            throw new AppError("Dígito verificador inválido ou letra não permitida", 422, "INVALID_CHECK_LETTER");
        }

        const expectedLetter: string = calculateCheckLetter(sequence);

        if (checkLetter !== expectedLetter) {
            throw new AppError(`Código ${code} inválido. Letra esperada: ${expectedLetter}, Recebida: ${checkLetter}`);
        }
    }

    public static buildPhysicalBill(code: string, store_id: string): PhysicalBill {
        PhysicalBill.validatePhysicalBillCode(code);
    
        const now: string = new Date().toISOString();

        return new PhysicalBill({
            id: crypto.randomUUID().toString(),
            code,
            store_id,
            is_lost: false,
            created_at: now,
            updated_at: now
        });
    }

    public static buildManyPhysicallBills(codes: Set<string>, store_id: string): Set<PhysicalBill> {
        const physical_bills = new Set<PhysicalBill>();

        for (const code of codes) {
            physical_bills.add(this.buildPhysicalBill(code, store_id));
        }

        return physical_bills;
    }

    public static restore(props: PhysicalBillProps): PhysicalBill {
        return new PhysicalBill(props);
    }

    get id() { return this.props.id }
    get code() { return this.props.code }
    get store_id() { return this.props.store_id }
    get is_lost() { return this.props.is_lost }
    get createdAt() { return this.props.created_at }
    get updatedAt() { return this.props.updated_at }
}