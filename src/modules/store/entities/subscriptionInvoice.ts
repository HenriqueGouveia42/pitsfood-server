import { DomainError } from "../../../shared/errors/DomainError.js";
import { SubscriptionPlan } from "./store.enums.js"; // Importando o Enum do arquivo store.ts

export enum InvoiceStatus {
    PENDING = "PENDING",     // gerado, aguardando pagamento
    PAID = "PAID",           // pago com sucesso
    FAILED = "FAILED",       // falha na transação (cartão recusado, erro no gateway)
    CANCELED = "CANCELED",   // expirou o tempo do PIX ou o admin cancelou manualmente
    REFUNDED = "REFUNDED"    // estornado
}

export type SubscriptionInvoiceProps = {
    readonly invoice_id: string;
    readonly amount_in_cents: number;
    readonly currency: string;
    readonly status: InvoiceStatus;
    
    //dados do Gateway (Abacate Pay)
    readonly gateway_invoice_id: string | null;
    readonly pix_code: string | null;
    readonly payment_url: string | null;

    readonly created_at: string;
    readonly paid_at: string | null;
    readonly period_end: string;

    //relacionamentos
    readonly store_id: string;
    readonly plan_tag: SubscriptionPlan; //qual plano está sendo cobrado
}

export type BuildSubscriptionInvoiceProps = {
    readonly now_date: string,
    readonly invoice_id: string,
    readonly amount_in_cents: number,
    readonly store_id: string,
    readonly plan_tag: SubscriptionPlan,
    readonly period_end: string,
    readonly gateway_data?: {
        gateway_invoice_id: string,
        pix_code: string,
        payment_url: string
    }

}

export class SubscriptionInvoice {

    private constructor(private readonly props: SubscriptionInvoiceProps) {}

    public get getProps(): SubscriptionInvoiceProps {
        return this.props;
    }

    private static validateAmount(amount: number): void {

        if (!Number.isInteger(amount)) throw new DomainError("O valor da fatura deve ser um número inteiro (centavos).", "INVALID_AMOUNT_TYPE");
        
        if (amount <= 0) throw new DomainError("O valor da fatura deve ser maior que zero.", "INVALID_AMOUNT_VALUE")
        
    }

    
    public static buildInvoice(build_props: BuildSubscriptionInvoiceProps): SubscriptionInvoice {

        // 1. Validações
        SubscriptionInvoice.validateAmount(build_props.amount_in_cents);

        if (build_props.plan_tag === SubscriptionPlan.NONE) throw new DomainError("Não é possível gerar uma fatura para o plano 'NONE'", "INVALID_PLAN_INVOICE");
        
        // 2. Criação
        const invoice = new SubscriptionInvoice({
            invoice_id: build_props.invoice_id,
            amount_in_cents: build_props.amount_in_cents,
            currency: "BRL", // Travado em BRL por enquanto
            status: InvoiceStatus.PENDING,
            
            // Se já tivermos a resposta do gateway, preenchemos. Se não, null.
            gateway_invoice_id: build_props.gateway_data?.gateway_invoice_id ?? null,
            pix_code: build_props.gateway_data?.pix_code ?? null,
            payment_url: build_props.gateway_data?.payment_url ?? null,

            created_at: build_props.now_date,
            paid_at: null,
            period_end: build_props.period_end,

            store_id: build_props.store_id,
            plan_tag: build_props.plan_tag
        });

        return invoice;
    }

    public static restore(props: SubscriptionInvoiceProps): SubscriptionInvoice {
        return new SubscriptionInvoice(props);
    }

    public markAsPaid(now_date: string): SubscriptionInvoice {
        if (this.props.status === InvoiceStatus.PAID) {
            //se já está paga, não faz nada ou lança erro (opcional, aqui apenas retorna a mesma)
            return this;
        }

        return new SubscriptionInvoice({
            ...this.props,
            status: InvoiceStatus.PAID,
            paid_at: now_date
        });
    }

    /**
     * Marca a fatura como FALHA/EXPIRADA.
     */
    public markAsFailed(): SubscriptionInvoice {
        return new SubscriptionInvoice({
            ...this.props,
            status: InvoiceStatus.FAILED
        });
    }

    public markAsCanceled(): SubscriptionInvoice {
        
        if (this.props.status !== InvoiceStatus.PENDING) throw new DomainError("Apenas faturas pendentes podem ser canceladas.", "INVALID_STATUS_TRANSITION" );
        

        return new SubscriptionInvoice({
            ...this.props,
            status: InvoiceStatus.CANCELED
        });
    }

    /**
     * Atualiza os dados do gateway (caso a fatura tenha sido criada antes de chamar a API externa)
     */
    public addGatewayDetails(gateway_invoice_id: string, pix_code: string, payment_url: string): SubscriptionInvoice {
        return new SubscriptionInvoice({
            ...this.props,
            gateway_invoice_id,
            pix_code,
            payment_url
        });
    }

   
    get id() { return this.props.invoice_id; }
    get amount() { return this.props.amount_in_cents; }
    get status() { return this.props.status; }
    get storeId() { return this.props.store_id; }
    get planTag() { return this.props.plan_tag; }
    
    get pixCode() { return this.props.pix_code; }
    get paymentUrl() { return this.props.payment_url; }
    
    get createdAt() { return this.props.created_at; }
    get paidAt() { return this.props.paid_at; }
    get periodEnd() { return this.props.period_end; }
    get gatewayInvoiceId() { return this.props.gateway_invoice_id; }
}