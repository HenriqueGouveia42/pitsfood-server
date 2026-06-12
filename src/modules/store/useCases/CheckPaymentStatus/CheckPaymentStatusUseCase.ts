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

// O front-end faz "pooling" com esse "Usecase" para verificar se o primeiro qr-code pix gerado para comprar o plano foi pago

export class CheckPaymentStatusUseCase {
    constructor(
        private invoiceRepository: ISubscriptionInvoiceRepository
    ) {}

    //1 - Buscar a fatura pelo seu "id"
    //2 - Verificar se o "invoice_id" é um id de fatura da mesma loja

    async execute({ invoice_id, store_id }: IRequest): Promise<CheckPaymentStatusResponse> {
        
        // 1
        const invoice = await this.invoiceRepository.findById(invoice_id);
        if (!invoice) throw new AppError("Fatura não encontrada", 404, "INVOICE_NOT_FOUND");
        
        if (invoice.storeId !== store_id) throw new AppError("Acesso negado. Esta fatura pertence a outra loja.", 403, "UNAUTHORIZED_ACCESS");
        
        return {
            status: invoice.status,
            paid_at: invoice.paidAt
        };
    }
}