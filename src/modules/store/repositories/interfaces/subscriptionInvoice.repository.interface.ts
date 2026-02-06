import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js"

export interface ISubscriptionInvoiceRepository {
    save(invoice: SubscriptionInvoice): Promise<void>;
    findById(invoice_id: string): Promise<SubscriptionInvoice | null>;
    update(invoice: SubscriptionInvoice): Promise<void>;
    findByGatewayId(gateway_id: string): Promise<SubscriptionInvoice | null>;
}