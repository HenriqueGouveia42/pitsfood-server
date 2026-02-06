import { AppError } from "../../../../shared/errors/AppError.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import { InvoiceStatus } from "../../entities/subscriptionInvoice.js";

interface CheckPaymentStatusResponse {
    status: InvoiceStatus;
    paid_at: string | null;
}

export class CheckPaymentStatusUseCase {
    constructor(
        private invoiceRepository: ISubscriptionInvoiceRepository
    ) {}

    async execute(invoice_id: string): Promise<CheckPaymentStatusResponse> {
        
        // Buscamos a fatura pelo ID dela (que o front recebeu ao gerar o PIX)
        const invoice = await this.invoiceRepository.findById(invoice_id);

        if (!invoice) {
            throw new AppError("Fatura não encontrada", 404, "INVOICE_NOT_FOUND");
        }

        return {
            status: invoice.status,
            paid_at: invoice.paidAt
        };
    }
}