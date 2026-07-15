import { AppError } from "../../../../../shared/errors/AppError.js";
import type { IStoreRepository } from "../../../repositories/interfaces/store.repository.interface.js";
import type { IUserRepository } from "../../../../user/repositories/interfaces/user.repository.interface.js";
import type { IPaymentProvider } from "../../../../../shared/providers/PaymentProvider/models/IPaymentProvider.js";
import { SubscriptionCalculator } from "../../../providers/SubscriptionCalculator.js";
import { SubscriptionPlan, SubscriptionStatus } from "../../../entities/store.enums.js";
import { Store } from "../../../entities/store.js";
import { SubscriptionInvoice } from "../../../entities/subscriptionInvoice.js";
import type { ISubscriptionInvoiceRepository } from "../../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { User } from "../../../../user/entities/user.js";
import type { BuildSubscriptionInvoiceProps } from "../../../entities/subscriptionInvoice.js";

import crypto from "crypto";

interface IRequest {
    store_id: string;
    user_id: string;
    plan: SubscriptionPlan; 
}

export interface IGenerateFirstSubscriptionPixUseCaseResponse {
    br_code: string;
    br_code_base64: string;
    amount: number;
    invoice_id: string;
}

export class GenerateFirstSubscriptionPixUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private paymentProvider: IPaymentProvider,
        private invoiceRepository: ISubscriptionInvoiceRepository,
        private calculator: SubscriptionCalculator
    ) {}

    // 1 - Validar o plano
    // 2 - Validar a loja
    // 3 - Validar o usuário
    // 4 - Verificar a idempotência de fatura
    // 5 - Calcular Fatura
    // 6 - Extrair os dados de usuário
    // 7 - Criar o Pagamento Pix Transparente com âncora para o webhook v2
    // 8 - Salvar a fatura no banco de dados

    async execute({ store_id, user_id, plan }: IRequest): Promise<IGenerateFirstSubscriptionPixUseCaseResponse> {
        
        // 1 - Validar o plano
        if (plan === SubscriptionPlan.NONE) { throw new AppError("Plano inválido.", 400, "MUST_CHOOSE_PLAN"); }
        if (!Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan)) { throw new AppError("Plano inválido.", 400, "INVALID_PLAN_TYPE"); }

        // 2 - Validar a loja
        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja não encontrada.", 404, "STORE_NOT_FOUND");

        if (store.subscription_status === SubscriptionStatus.ACTIVE) {
            throw new AppError(
                "Sua loja já possui uma assinatura ativa. Aguarde o vencimento para renovar.", 
                409,
                "SUBSCRIPTION_ALREADY_ACTIVE"
            );
        }

        // 3 - Validar o usuário
        const owner: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!owner) throw new AppError("Dono não encontrado.", 404, "USER_NOT_FOUND");
        if(store.ownerId !== owner.id) throw new AppError("Usuario nao relacionado com essa loja", 422, "STORE_MISMATCH")

        // 4 - Verificar a idempotência de fatura
        const pendingInvoice: SubscriptionInvoice | null = await this.invoiceRepository.findPendingByStoreId(store_id);
        
        if (pendingInvoice) {

            if (!pendingInvoice.pixCode) throw new AppError("Erro grave de integração. Fatura existe no sistema mas sem código PIX", 500, "INVOICE_WITHOUT_PIX_CODE");

            if (pendingInvoice.planTag === plan) {
                return {
                    br_code: pendingInvoice.pixCode,
                    br_code_base64: pendingInvoice.paymentUrl || "", // Reutilizando o campo para devolver o base64
                    amount: pendingInvoice.amount,
                    invoice_id: pendingInvoice.id
                };
            }

            throw new AppError(
                "Você já possui uma fatura pendente para outro plano. Aguarde ela expirar ou entre em contato com o suporte.",
                409,
                "PENDING_INVOICE_EXISTS"
            );
        }

        // 5 - Calcular Fatura
        const now = new Date();
        const { amount_in_cents, target_date } = this.calculator.calculateInvoice(plan, now);

        // 6 - Extrair os dados de usuário
        const rawTaxId: string | undefined = owner.cpf_cnpj ? owner.cpf_cnpj : undefined;
        if(!rawTaxId) throw new AppError("Usuario que tenta gerar fatura obrigatoriamente possui um cpf/cnpj", 400, "INVALID_USER");

        const invoice_id: string = crypto.randomUUID();

         // 7 - Criar o Pagamento Pix Transparente com âncora para o webhook v2
        const paymentData = await this.paymentProvider.createTransparentPix({
            amount: amount_in_cents,
            description: `Assinatura ${plan} (1 Mês)`,
            expiresIn: 86400, // 24 horas em segundos
            customer: {
                name: owner.username,
                email: owner.email,
                taxId: rawTaxId,
                cellphone: owner.phone ? owner.phone : "(00) 00000-0000"
            },
            metadata: {
                internal_invoice_id: invoice_id // Âncora para o webhook v2 -> Esse dado é o que liga o ABACATE PAY ao SISTEMA INTERNO
            }
        });

        // 8 - Salvar a fatura no banco de dados
        const build_invoice_props: BuildSubscriptionInvoiceProps = {
            now_date: now.toISOString(),
            invoice_id,
            amount_in_cents,
            store_id: store.id,
            plan_tag: plan,
            period_end: target_date.toISOString(),
            gateway_data: {
                gateway_invoice_id: paymentData.id, // ESSE DADO É O QUE QUE VAI SER UTILIZADO PELO USECASE CHAMADO PELO WEBHOOK PRA INFORMAR QUE A FATURA FOI PAGA
                pix_code: paymentData.brCode,
                payment_url: paymentData.brCodeBase64 
            }
        }

        const invoice: SubscriptionInvoice = SubscriptionInvoice.buildInvoice(build_invoice_props);

        await this.invoiceRepository.save(invoice);

        // "invoice.id" será utilizado para o front-end fazer pooling
        return {
            br_code: paymentData.brCode,
            br_code_base64: paymentData.brCodeBase64,
            amount: amount_in_cents,
            invoice_id: invoice.id
        };
    }
}