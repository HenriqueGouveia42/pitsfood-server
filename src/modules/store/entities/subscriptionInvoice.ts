import { DomainError } from "../../../shared/errors/DomainError.js";
import { SubscriptionPlan } from "./store.enums.js";

export enum InvoiceStatus {
    PENDING = "PENDING",     
    PAID = "PAID",           
    FAILED = "FAILED",       
    CANCELED = "CANCELED",   
    REFUNDED = "REFUNDED"    
}

export type SubscriptionInvoiceProps = {
    readonly invoice_id: string;
    readonly amount_in_cents: number;
    readonly currency: string;
    readonly status: InvoiceStatus;
    
    // dados do Gateway
    readonly gateway_invoice_id: string | null;
    readonly pix_code: string | null;
    readonly payment_url: string | null;

    readonly created_at: string;
    readonly paid_at: string | null;
    readonly period_end: string;

    // relacionamentos
    readonly store_id: string;
    readonly plan_tag: SubscriptionPlan; 
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
        pix_code: string | null, // ATUALIZADO
        payment_url: string | null // ATUALIZADO: Agora aceita null perfeitamente
    }
}

export class SubscriptionInvoice {

    private constructor(private readonly props: SubscriptionInvoiceProps) {}

    public get getProps(): SubscriptionInvoiceProps {
        return this.props;
    }

    private static validateAmount(amount: number): void {
        if (!Number.isInteger(amount)) throw new DomainError("O valor da fatura deve ser um número inteiro (centavos).", "INVALID_AMOUNT_TYPE");
        if (amount <= 0) throw new DomainError("O valor da fatura deve ser maior que zero.", "INVALID_AMOUNT_VALUE");
    }

    public static buildInvoice(build_props: BuildSubscriptionInvoiceProps): SubscriptionInvoice {

        // 1. Validações
        SubscriptionInvoice.validateAmount(build_props.amount_in_cents);

        if (build_props.plan_tag === SubscriptionPlan.NONE) throw new DomainError("Não é possível gerar uma fatura para o plano 'NONE'", "INVALID_PLAN_INVOICE");
        
        // 2. Criação
        const invoice = new SubscriptionInvoice({
            invoice_id: build_props.invoice_id,
            amount_in_cents: build_props.amount_in_cents,
            currency: "BRL", 
            status: InvoiceStatus.PENDING,
            
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
            return this;
        }

        return new SubscriptionInvoice({
            ...this.props,
            status: InvoiceStatus.PAID,
            paid_at: now_date
        });
    }

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

    // ATUALIZADO: Assinatura reflete a nova realidade
    public addGatewayDetails(gateway_invoice_id: string, pix_code: string | null, payment_url: string | null): SubscriptionInvoice {
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