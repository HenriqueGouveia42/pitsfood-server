import { AppError } from "../../../shared/errors/AppError.js";

export type PhysicalBillProps = {
    id: string,
    code: string,
    store_id: string,
    is_lost: boolean,
    created_at: string,
    updated_at: string
}

export class PhysicalBill{

    private constructor(private readonly props: PhysicalBillProps){}

    private static validatePhysicalBillCode(code: string): void{
        
        if (code.length !== 4) throw new AppError("Codigo precisa ter exatamente 4 digitos", 422, "INVALID_GTIN_CODE_LENGTH");
        if (!/^\d+$/.test(code)) throw new AppError("Codigo precisa conter apenas números", 422, "INVALID_GTIN_CODE");

        let sum: number = 0;
        let impar: boolean = true;

        const code_to_verify: string = code.slice(0, -1);

        for (const char of code_to_verify){
            impar ?
                sum += Number(char)
                :
                sum += 3 * Number(char)
            
            impar = !impar
        }

        const verifier_number: number = ( 10 - (sum % 10) ) % 10;
        
        const lastDigit: number = Number(code.slice(-1));

        if (verifier_number !== lastDigit) throw new AppError(`Código ${code} inválido. Dígito esperado: ${verifier_number}, Recebido: ${lastDigit}`);
    }

    public static buildPhysicalBill(code: string, store_id:string): PhysicalBill{

        PhysicalBill.validatePhysicalBillCode(code);
    
        const now: string = new Date().toISOString();

        return new PhysicalBill({
            id: crypto.randomUUID().toString(),
            code,
            store_id,
            is_lost: false,
            created_at: now,
            updated_at: now
        })

    }

    public static buildManyPhysicallBills(codes: Set<string>, store_id: string): Set<PhysicalBill>{

        let physical_bills: Set<PhysicalBill> = new Set<PhysicalBill>();

        for (const code of codes){
            physical_bills.add(this.buildPhysicalBill(code, store_id));
        }

        return physical_bills

    }

    public static restore(props: PhysicalBillProps): PhysicalBill {
        return new PhysicalBill(props);
    }

    get id() {return this.props.id}
    get code() {return this.props.code}
    get store_id() {return this.props.store_id}
    get is_lost() {return this.props.is_lost}
    get createdAt() {return this.props.created_at}
    get updatedAt() {return this.props.updated_at}
}
