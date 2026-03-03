import { Decimal } from "decimal.js";
import { AppError } from "../../../shared/errors/AppError.js";

export enum SaleStatus {
    CONCLUIDA = "CONCLUIDA",
    CANCELADA = "CANCELADA",
    ESTORNADA = "ESTORNADA"
}

export enum PaymentMethod {
  PIX = "PIX",
  ESPECIE = "ESPECIE",
  CARTAO_DEBITO = "CARTAO_DEBITO",
  CARTAO_CREDITO = "CARTAO_CREDITO"
}

export type SalePaymentProp = { //representa um pagamento de uma determinada venda  fechada
    readonly sale_payment_id: string,
    readonly amount: Decimal,
    readonly method: PaymentMethod,
    readonly sale_id: string,
}

export type SaleProductProp = { //representa um produto numa venda fechada
    readonly sale_product_id: string,
    readonly quantity: number,

    readonly unit_price_snapshot: Decimal,
    readonly product_name_snapshot: string,
    readonly product_gtin_snapshot: string

    readonly store_id: string,
    readonly sale_id: string,
    readonly product_id: string,
    readonly origin_bill_id?: string //opcional pois o item da venda pode ter sido feito direto no balcao, ou seja, sem comanda
}

export type SaleProp = { //representa uma venda fechada
    readonly sale_id: string;
    readonly total_price: Decimal; // Valor TOTAL DA VENDA (Custo dos itens)
    readonly status: SaleStatus;

    readonly created_at: string;
    readonly updated_at: string;

    readonly store_id: string;
    readonly user_id: string;
   
    readonly items: SaleProductProp[];
    readonly payments: SalePaymentProp[];
}

//interface para o input do buildSale (Pattern: Parameter Object)
interface BuildSaleParams {
    store_id: string;
    user_id: string;
    items: SaleProductProp[];
    payments: SalePaymentProp[];
    sale_id?: string;
}

export class Sale {

    private constructor(private readonly props: SaleProp) {}

    private static validateTotals(totalAmountFromItems: Decimal, totalPaid: Decimal, payments: SalePaymentProp[]) {
        // 1. Verifica se o valor pago é suficiente para cobrir a venda
        if (totalPaid.lessThan(totalAmountFromItems)) {
            throw new AppError(`Pagamento menor do que o valor da conta. Total Venda: ${totalAmountFromItems}, Total Pago: ${totalPaid}`, 422, "INSUFICIENT_PAYMENT");
        }

        // 2. Calcula se há troco
        const troco = totalPaid.minus(totalAmountFromItems);

        if (troco.greaterThan(0)) {
            // 3. Soma todo o dinheiro físico (espécie) que o cliente entregou
            const totalEmEspecie = payments
                .filter(p => p.method === PaymentMethod.ESPECIE)
                .reduce((acc, pay) => acc.plus(pay.amount), new Decimal(0));

            // 4. Regra de Negócio: Troco nunca pode ser maior que o valor dado em dinheiro físico
            if (troco.greaterThan(totalEmEspecie)) {
                throw new AppError(
                    "O valor do troco não pode ser maior que o valor pago em espécie. Pagamentos em PIX ou Cartão não geram troco.", 
                    422, 
                    "INVALID_CHANGE_FOR_PAYMENT_METHOD"
                );
            }
        }
    }

    public static buildSale(params: BuildSaleParams): Sale {
        
        if (params.items.length === 0) throw new AppError("Não é possível criar uma venda sem itens.", 402, "NO_ITENS");
        
        const calculatedTotalPrice: Decimal = params.items.reduce((acc, item) => {
            return acc.plus(item.unit_price_snapshot.times(item.quantity));
        }, new Decimal(0));

        //quanto foi pago
        const calculatedTotalPaid = params.payments.reduce((acc, pay) => {
            return acc.plus(pay.amount);
        }, new Decimal(0));

        //valida consistencia (agora passando os pagamentos para validar o troco)
        Sale.validateTotals(calculatedTotalPrice, calculatedTotalPaid, params.payments);

        const now: string = new Date().toISOString();

        const saleId: string = params.sale_id ?? crypto.randomUUID();

        return new Sale({
            sale_id: saleId,
            total_price: calculatedTotalPrice,
            status: SaleStatus.CONCLUIDA,
            created_at: now,
            updated_at: now,
            store_id: params.store_id,
            user_id: params.user_id,
            items: params.items,
            payments: params.payments
        });
    }

    public static restore(props: SaleProp): Sale {
        return new Sale(props);
    }

    //getters
    get id() { return this.props.sale_id; }
    get total() { return this.props.total_price; }    
    get status() { return this.props.status; }

    get createdAt() { return this.props.created_at; }
    get updatedAt() { return this.props.updated_at; }

    get store_id() { return this.props.store_id; }
    get userId() { return this.props.user_id; }

    get items() { return this.props.items; }
    get payments() { return this.props.payments; }
    
    get amountPaid() {
        return this.props.payments.reduce((acc, pay) => acc.plus(pay.amount), new Decimal(0));
    }

    public withCancelledStatus(): Sale {
        if (this.props.status !== SaleStatus.CONCLUIDA) {
            throw new AppError("Apenas vendas concluídas podem ser canceladas.", 409, "SALE_STATUS_CONFLICT")
        }
        
        return new Sale({
            ...this.props,
            status: SaleStatus.CANCELADA,
            updated_at: new Date().toISOString()
        });
    }
}