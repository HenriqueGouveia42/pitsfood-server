import { Decimal } from 'decimal.js';
import { Product } from '../../product/entities/product.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { DomainError } from '../../../shared/errors/DomainError.js';

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

    readonly active: boolean,
    readonly deactivated_by_user_id: string | null,
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
    readonly closed_at: string | null;
    readonly items: BillItemProps[]; //relacionamento com bill_items
}

export type BuildBillProps = {
    bill_id: string,
    bill_code_gtin: string,
    store_id: string,
    now_string: string
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

    public static buildOpenedBill(build_props: BuildBillProps): Bill {

        Bill.validateBillCode(build_props.bill_code_gtin);

        return new Bill({
            bill_id: build_props.bill_id,
            bill_code_gtin: build_props.bill_code_gtin,
            status: billStates.ABERTA,
            store_id: build_props.store_id,
            created_at: build_props.now_string,
            updated_at: build_props.now_string,
            items: [], //inicia sem itens,
            closed_at: null
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
    get closed_at() { return this.props.closed_at }

    public close(now_string: string): Bill{ //fechar comanda - realizar venda

        if(this.props.status === billStates.FECHADA) throw new DomainError("Essa comanda já está fechada", "BILL_ALREADY_CLOSED");
        
        if(this.props.items.length === 0) throw new DomainError("Não pode fechar uma comanda sem itens", "BILL_WITHOUT_ITEMS");
        
        return new Bill({
            ...this.props,
            status: billStates.FECHADA,
            updated_at: now_string,
            closed_at: now_string
        })
    }

    public reopen(now_string: string): Bill{ //reabrir comanda - venda realizada - adicionar mais itens

        if(this.props.status !== billStates.FECHADA){
            throw new Error("Apenas comandas fechadas podem ser reabertas");
        }
        return new Bill({
            ...this.props,
            status: billStates.ABERTA,
            updated_at: now_string,
            closed_at: null
        })
    }

    public addProduct(product: Product, quantity: number, store_id: string, user_id: string, now_string: string, random_ids: string[]): Bill {

        if (quantity <= 0 || !Number.isInteger(quantity)) throw new DomainError("A quantidade deve ser um número inteiro maior que zero.", "INVALID_QUANTITY");
        if (!Array.isArray(random_ids)) throw new DomainError("Nao é um array de ids", "MISSING_ARRAY");
        if (random_ids.length !== quantity) throw new DomainError("As quantidades de ids e quantidade de produtos devem ser iguais");

        // O TypeScript sabe que 'id' é estritamente 'string' aqui, pois estamos mapeando os elementos reais
        const newItems: BillItemProps[] = random_ids.map(id => ({
            bill_item_id: id,
            product_name: product.name,
            price_at_addition: product.price,
            bill_id: this.props.bill_id,
            store_id: store_id,
            created_at: now_string,
            updated_at: now_string,
            product_id: product.id,
            user_id: user_id,
            product_gtin_code: product.gtin,
            active: true,
            deactivated_by_user_id: null,
        }));

        return new Bill({
            ...this.props,
            items: [...this.props.items, ...newItems],
            updated_at: now_string
        });
    }

    public deactivateProduct(bill_item_id: string, user_id: string, now_string: string): Bill {
        
        // 1. A comanda precisa estar aberta para sofrer alterações
        if (this.props.status !== billStates.ABERTA) {
            throw new DomainError("Não é possível remover itens de uma comanda fechada ou cancelada", "BILL_NOT_OPEN");
        }

        // 2. Encontrar o item na comanda com .find()
        const itemToUpdate = this.props.items.find(item => item.bill_item_id === bill_item_id);
        
        if (!itemToUpdate) throw new DomainError("Item não encontrado nesta comanda", "ITEM_NOT_FOUND");
        
        // 3. Verifica se já foi removido (Idempotência)
        if (!itemToUpdate.active) throw new DomainError("Este item já foi removido anteriormente", "ITEM_ALREADY_REMOVED");
        
        // 4. Cria a nova lista de itens iterando com .map()
        const updatedItems = this.props.items.map(item => 
            item.bill_item_id === bill_item_id 
                ? { ...item, active: false, deactivated_by_user_id: user_id, updated_at: now_string }
                : item
        );

        // 5. Retorna a nova instância da comanda
        return new Bill({
            ...this.props,
            items: updatedItems,
            updated_at: now_string
        });
    }

    public reactivateProduct(bill_item_id: string, now_string: string): Bill {
        
        // 1. A comanda precisa estar aberta
        if (this.props.status !== billStates.ABERTA) throw new DomainError("Não é possível reativar itens de uma comanda fechada ou cancelada", "BILL_NOT_OPEN");
        

        // 2. Encontrar o item
        const itemToUpdate = this.props.items.find(item => item.bill_item_id === bill_item_id);
        
        if (!itemToUpdate) throw new DomainError("Item não encontrado nesta comanda", "ITEM_NOT_FOUND");
        

        // 3. Verifica se já está ativo (Idempotência)
        if (itemToUpdate.active) throw new DomainError("Este item já está ativo na comanda", "ITEM_ALREADY_ACTIVE");
        

        // 4. Cria a nova lista de itens alterando o status para true e limpando o usuario
        const updatedItems = this.props.items.map(item => 
            item.bill_item_id === bill_item_id 
                ? { ...item, active: true, deactivated_by_user_id: null, updated_at: now_string }
                : item
        );

        // 5. Retorna a nova instância
        return new Bill({
            ...this.props,
            items: updatedItems,
            updated_at: now_string
        });
    }

}