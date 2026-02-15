import { Decimal } from 'decimal.js';
import { Product } from '../../product/entities/product.js';
import { AppError } from '../../../shared/errors/AppError.js';

//tipo de um item na comanda
export type BillItemProps = {
    readonly bill_item_id:  string; //representa uma adição específica em uma comanda específica
    readonly product_name: string,
    readonly price_at_addition: Decimal;
    readonly bill_id: string, //de qual comanda veio
    readonly store_id: string

    readonly created_at: string,
    readonly updated_at: string,

    readonly product_id: string; //qual produto
    readonly user_id: string; //quem adicionou
    readonly product_gtin_code: string

}

//estados possiveis de uma comanda
export enum billStates{
    ABERTA = "ABERTA", //apta a receber novos itens - estado inicial da criacao de uma comanda
    FECHADA = "FECHADA",
    CANCELADA = "CANCELADA"
}

//tipo de uma comanda em uso
export type BillProps = {
    readonly bill_id: string; //representa um uso específico da comanda física
    readonly bill_code_gtin: string; //representa uma comanda física. Comanda "1025", por exemplo, que será utilizada por diversos clientes
    readonly status: billStates;
    readonly store_id: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly items: BillItemProps[]; //relacionamento com bill_items
}

export class Bill {

    private constructor(private readonly props: BillProps) {}

    private static validateBillCode(gtin: string){

        if(gtin.length != 4){
            throw new Error("Codigo da comanda precisa ter 4 digitos")
        }

        //verificas se a string contém APENAS dígitos de 0 a 9
        if (!/^\d+$/.test(gtin)) {
            throw new Error("O código de 4 digitos deve conter apenas números");
        }

        const startsWith0 = gtin.startsWith('0');

        if(startsWith0){
            throw new Error("O código da comanda nao pode comecar com '0'");
        }

        const lastNumber = Number(gtin.slice(-1));

        let sum: number = 0;
        let impar: boolean = true;

        for(let i = 0; i < gtin.length-1; i++){

            let currentNumber = Number(gtin[i]);

            impar ?
            sum += currentNumber
            :
            sum += (3 * currentNumber);

            impar = !impar
            
        }

        sum = sum % 10;

        const expectedCheckNumber = (10 - sum) % 10;

        if(lastNumber != expectedCheckNumber){
            throw new Error("Codigo da comanda inválido. Digito Verificador incorreto. O codigo de 4 digitos segue a mesma regra do GTIN-13 para o Digito Verificador.")
        }
    }

    public static buildOpenedBill(bill_code_gtin: string, store_id: string): Bill {

        Bill.validateBillCode(bill_code_gtin);

        const now = new Date().toISOString();

        return new Bill({
            bill_id: crypto.randomUUID().toString(),
            bill_code_gtin: bill_code_gtin,
            status: billStates.ABERTA,
            store_id,
            created_at: now,
            updated_at: now,
            items: [] //inicia sem itens
        });
    }

    public static restoreBill(props: BillProps): Bill{
        return new Bill(props)
    }

    //getters para acesso seguro aos dados -- readonly permite apenas ler
    get bill_id() {return this.props.bill_id}
    get bill_code() {return this.props.bill_code_gtin}
    get status() {return this.props.status}
    get store_id() {return this.props.store_id}
    get createdAt() {return this.props.created_at}
    get updatedAt() {return this.props.updated_at}
    get items() {return this.props.items}

    public close(): Bill{ //fechar comanda - realizar venda

        if(this.props.status === billStates.FECHADA){
            throw new Error("Essa comanda já está fechada");
        }

        if(this.props.items.length === 0){
            throw new Error("Não pode fechar uma comanda sem itens")
        }

        return new Bill({
            ...this.props,
            status: billStates.FECHADA,
            updated_at: new Date().toISOString()
        })
    }

    public reopen(): Bill{ //reabrir comanda - venda realizada - adicionar mais itens

        if(this.props.status !== billStates.FECHADA){
            throw new Error("Apenas comandas fechadas podem ser reabertas");
        }
        return new Bill({
            ...this.props,
            status: billStates.ABERTA,
            updated_at: new Date().toISOString()
        })
    }

    public addProduct(product: Product, quantity: number, store_id: string, user_id: string): Bill {

        if (quantity <= 0 || !Number.isInteger(quantity)) throw new AppError("A quantidade deve ser um número inteiro maior que zero.", 400, "INVALID_QUANTITY");

        const now = new Date().toISOString();
        
        const newItems: BillItemProps[] = [];

        for (let i = 0; i < quantity; i++){
            newItems.push({
                bill_item_id: crypto.randomUUID(),
                product_name: product.name,
                price_at_addition: product.price,
                bill_id: this.props.bill_id,
                store_id: store_id,
                created_at: now,
                updated_at: now,
                product_id: product.id,
                user_id: user_id,
                product_gtin_code: product.gtin
            })
        }

        return new Bill({
            ...this.props,
            items: [...this.props.items, ...newItems],
            updated_at: now
        })
        
    }

}