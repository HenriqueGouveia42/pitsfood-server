import { Decimal } from "decimal.js";

// A estrutura dos dados (parecida com o Prisma, mas desacoplada)
export type StockEntryProps = {
    entry_id: string;
    product_id: string;
    store_id: string;
    user_name: string;      //note que aqui já trazemos o nome pronto para facilitar o front
    product_name: string;   //mnome do produto na época da entrada
    quantity: number;
    unit_cost: Decimal;
    total_cost: Decimal;
    created_at: Date | string; //aceita Date (do banco) ou string (se vier de JSON)
}

export class StockEntry {
    
    private constructor(private readonly props: StockEntryProps) {}

    public static restore(props: StockEntryProps): StockEntry {
        return new StockEntry(props);
    }

    get id() { return this.props.entry_id; }
    get quantity() { return this.props.quantity; }
    get unitCost() { return this.props.unit_cost; }
    get totalCost() { return this.props.total_cost; }
    get date() { return new Date(this.props.created_at); }
    get userName() { return this.props.user_name; }
    get productName() { return this.props.product_name; }
}