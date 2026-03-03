import { AppError } from "../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import type { IPaymentProvider } from "../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import { SubscriptionCalculator } from "../../providers/SubscriptionCalculator.js";
import { Store, SubscriptionPlan, SubscriptionStatus } from "../../entities/store.js";
import { SubscriptionInvoice } from "../../entities/subscriptionInvoice.js";
import type { ISubscriptionInvoiceRepository } from "../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { User } from "../../../user/entities/user.js";

interface IRequest {
    store_id: string;
    user_id: string;
    plan: SubscriptionPlan; 
}

interface IResponse {
    payment_url: string;
    amount: number;
    days_charged: number;
    invoice_id: string
}

export class GenerateSubscriptionPixUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private paymentProvider: IPaymentProvider,
        private invoiceRepository: ISubscriptionInvoiceRepository
    ) {}

    async execute({ store_id, user_id, plan }: IRequest): Promise<IResponse> {
        
        //1- validação básica
        if (plan === SubscriptionPlan.NONE) {
            throw new AppError("Plano inválido.", 400, "MUST_CHOOSE_PLAN");
        }

        //2 - busca e Validação da Loja/Dono
        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja não encontrada.", 404, "STORE_NOT_FOUND");
        
        const owner: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!owner) throw new AppError("Dono não encontrado.", 404, "USER_NOT_FOUND");

        //3  - TRAVA DE SEGURANÇA 1: Assinatura Ativa
        // Se já paga, não gera nova cobrança
        if (store.subscription_status === SubscriptionStatus.ACTIVE) {
            throw new AppError(
                "Sua loja já possui uma assinatura ativa. Aguarde o vencimento para renovar.", 
                409, // Conflict
                "SUBSCRIPTION_ALREADY_ACTIVE"
            );
        }

        //4 - TRAVA DE SEGURANÇA 2: Fatura Pendente (Idempotência)
        //se já existe um PIX gerado e não pago, não criamos lixo no Gateway.
        const pendingInvoice = await this.invoiceRepository.findPendingByStoreId(store_id);
        
        if (pendingInvoice) {
            //se ele tentou comprar o MESMO plano antes, devolvemos o mesmo PIX
            if (pendingInvoice.planTag === plan) {
                return {
                    payment_url: pendingInvoice.paymentUrl || "",
                    amount: pendingInvoice.amount,
                    days_charged: 0,
                    invoice_id: pendingInvoice.id
                };
            }

            //se ele tentou comprar OUTRO plano (ex: queria Basic, agora quer Premium)
            //BLOQUEIO: "Resolva a pendência anterior primeiro"
            throw new AppError(
                "Você já possui uma fatura pendente para outro plano. Aguarde ela expirar ou entre em contato com o suporte.",
                409,
                "PENDING_INVOICE_EXISTS"
            );
        }

        //5 - Fluxo de Criação (Só chega aqui se não tiver pendências)
        const { amount_in_cents, days_charged } = SubscriptionCalculator.calculateProRata(plan);

        //6 - garante que enviamos apenas números no taxId (CPF/CNPJ)
        const rawTaxId: string = owner.cpf_cnpj;
        const cleanTaxId = rawTaxId.replace(/\D/g, "");

        const gatewayCustomerId = await this.paymentProvider.createCustomer({
            name: owner.username,
            email: owner.email,
            taxId: cleanTaxId,
            cellphone: owner.phone ? owner.phone : "(00) 00000-0000"
        });

        const paymentData = await this.paymentProvider.createPixPayment({
            customerId: gatewayCustomerId,
            amount_in_cents: amount_in_cents,
            description: `Assinatura ${plan} - Proporcional (${days_charged} dias)`,
            dueDate: new Date()
        });

        const invoice = SubscriptionInvoice.buildInvoice(
            amount_in_cents,
            store.id,
            plan,
            new Date().toISOString(),
            {
                gateway_invoice_id: paymentData.payment_id,
                payment_url: paymentData.payment_url,
                pix_code: "" 
            }
        );

        await this.invoiceRepository.save(invoice);

        return {
            payment_url: paymentData.payment_url,
            amount: amount_in_cents,
            days_charged,
            invoice_id: invoice.id
        };
    }
}