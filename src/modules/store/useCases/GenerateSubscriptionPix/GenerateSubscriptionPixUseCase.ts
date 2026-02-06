import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import type { IPaymentProvider } from "../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import { SubscriptionCalculator } from "../../providers/SubscriptionCalculator.js";
import { SubscriptionPlan, Store } from "../../entities/store.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js"; // Interface que você criará

interface IRequest {
    store_id: string;
    user_id: string;
    plan: SubscriptionPlan; //plano escolhido BASIC, PREMIUM...)
}

interface IResponse {
    payment_url: string;
    amount: number;
    days_charged: number;
}

export class GenerateSubscriptionPixUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private paymentProvider: IPaymentProvider,
        private invoiceRepository: ISubscriptionInvoiceRepository //novo repo para salvar a fatura
    ) {}

    async execute({ store_id, user_id, plan }: IRequest): Promise<IResponse> {
        
        //validações iniciais
        if (plan === SubscriptionPlan.NONE) throw new AppError("Plano inválido", 400, "MUST_CHOSE_PLAN");

        const store = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja não encontrada", 404, "STORE_NOT_FOUND");
        
        const owner = await this.userRepository.findSavedUserById(user_id);
        if (!owner) throw new AppError("Dono não encontrado", 404, "USER_NOT_FOUN");
        
        //validar se já existe fatura pendente para não gerar duplicado (opcional)
        const { amount_in_cents, days_charged } = SubscriptionCalculator.calculateProRata(plan);

        //criar cliente no Gateway
        const gatewayCustomerId = await this.paymentProvider.createCustomer({
            name: owner.username,
            email: owner.email,
            taxId: store.cnpj || "11900862476",
            cellphone: "(00) 00000-0000" // Você precisará pedir isso no cadastro ou update
        });

        //gerar a Cobrança no gateway
        const paymentData = await this.paymentProvider.createPixPayment({
            customerId: gatewayCustomerId,
            amount_in_cents: amount_in_cents,
            description: `Assinatura ${plan} - Proporcional (${days_charged} dias) até dia 28.`,
            dueDate: new Date() // Vence hoje
        });

        //salvar a fatura no banco (Para controle interno e Webhook futuro)
        const invoice: SubscriptionInvoice = SubscriptionInvoice.buildInvoice(
            amount_in_cents,
            store.id,
            plan,
            new Date().toISOString(), //due Date
            {
                gateway_invoice_id: paymentData.payment_id,
                payment_url: paymentData.payment_url,
                pix_code: "" //endpoint billing não retorna o Pix copia e cola direto no JSON as vezes, usa a URL
            }
        );

        await this.invoiceRepository.save(invoice);

        return {
            payment_url: paymentData.payment_url,
            amount: amount_in_cents,
            days_charged
        };
    }
}