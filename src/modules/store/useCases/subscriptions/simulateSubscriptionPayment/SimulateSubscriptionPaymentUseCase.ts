import { AppError } from "../../../../../shared/errors/AppError.js";
import type { ISubscriptionInvoiceRepository } from "../../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { IPaymentProvider } from "../../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import type { SubscriptionInvoice } from "../../../entities/subscriptionInvoice.js";

interface IRequest {
    invoice_id: string;
    store_id: string;
}

export class SimulateSubscriptionPaymentUseCase {
    constructor(
        private invoiceRepository: ISubscriptionInvoiceRepository,
        private paymentProvider: IPaymentProvider
    ) {}

    // 1 - Verficiar se o sistema está em ambiente de desenvolvimento
    // 2 - Verificar bloqueio multi-tenant

    async execute({ invoice_id, store_id }: IRequest): Promise<void> {

        // 1
        if (process.env.NODE_ENV === "production") throw new AppError("Operação não permitida em ambiente de produção.", 403, "NOT_ALLOWED_IN_PRODUCTION");
        
        const invoice: SubscriptionInvoice | null = await this.invoiceRepository.findById(invoice_id);
        if (!invoice) throw new AppError("Fatura não encontrada.", 404, "INVOICE_NOT_FOUND");
        
        // 2
        if (invoice.storeId !== store_id) throw new AppError("Acesso negado a esta fatura.", 403, "UNAUTHORIZED_ACCESS");
        
        const gatewayInvoiceId: string | null = invoice.gatewayInvoiceId;
        if (!gatewayInvoiceId) throw new AppError("Esta fatura não possui uma transação correspondente no gateway.", 400, "MISSING_GATEWAY_ID");
    
        await this.paymentProvider.simulateTransparentPix(gatewayInvoiceId);
    }
}