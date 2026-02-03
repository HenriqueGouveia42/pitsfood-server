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

    private static validatePhysicalBillCode(code: string){
        
        //precisa ter somente numeros
        
        const to_number: number = Number(code);

        if (typeof(to_number) != "number") throw new AppError("Codigo precisa ser numerico", 422, "INVALID_GTIN_CODE")

        //precisa ter exatamente 4 numeros

        if (code.length != 4) throw new AppError("Codigo precisa ter exatamente 4 numeros", 422, "INVALID_GTIN_CODE_LENGHT")
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

    get id() {return this.props.id}
    get code() {return this.props.code}
    get store_id() {return this.props.store_id}
    get is_lost() {return this.props.is_lost}
    get createdAt() {return this.props.created_at}
    get updatedAt() {return this.props.updated_at}
}
