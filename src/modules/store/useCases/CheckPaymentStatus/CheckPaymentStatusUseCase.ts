import { AppError } from "../../../../shared/errors/AppError.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import { InvoiceStatus } from "../../entities/subscriptionInvoice.js";

interface IRequest {
    invoice_id: string;
    store_id: string;
}

interface CheckPaymentStatusResponse {
    status: InvoiceStatus;
    paid_at: string | null;
}

export class CheckPaymentStatusUseCase {
    constructor(
        private invoiceRepository: ISubscriptionInvoiceRepository
    ) {}

    async execute({ invoice_id, store_id }: IRequest): Promise<CheckPaymentStatusResponse> {
        
        // Buscamos a fatura pelo ID interno
        const invoice = await this.invoiceRepository.findById(invoice_id);

        if (!invoice) {
            throw new AppError("Fatura não encontrada", 404, "INVOICE_NOT_FOUND");
        }

        // TRAVA DE SEGURANÇA MULTI-TENANT:
        // Garante que a fatura consultada pertence à loja de quem fez a requisição
        if (invoice.storeId !== store_id) {
            throw new AppError("Acesso negado. Esta fatura pertence a outra loja.", 403, "UNAUTHORIZED_ACCESS");
        }

        return {
            status: invoice.status,
            paid_at: invoice.paidAt
        };
    }
}