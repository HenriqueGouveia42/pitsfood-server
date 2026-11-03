import { AppError } from "../../../../../shared/errors/AppError.js";
import { SubscriptionPlan } from "../../../entities/store.enums.js";
import type { IStoreRepository } from "../../../repositories/interfaces/store.repository.interface.js";
import { SubscriptionCalculator } from "../../../providers/SubscriptionCalculator.js";
import type { IPaymentProvider } from "../../../../../shared/providers/interfaces/paymentProvider/IPaymentProvider.js";
import { UserRole } from "../../../../user/entities/user.js";
import type { IUserRepository } from "../../../../user/repositories/interfaces/user.repository.interface.js";
import { SubscriptionInvoice } from "../../../entities/subscriptionInvoice.js";
import type { ISubscriptionInvoiceRepository } from "../../../repositories/interfaces/subscriptionInvoice.repository.interface.js";
import type { BuildSubscriptionInvoiceProps } from "../../../entities/subscriptionInvoice.js";
import type { IGenerateFirstSubscriptionPixUseCaseResponse as IGenerateRenewSubscriptionPixUseCaseResponse } from "../generateFirstSubscriptionPix/GenerateFirstSubscriptionPixUseCase.js";

import crypto from "crypto";

interface IRenewSubscriptionUseCaseRequest {
    store_id: string;
    user_id: string;
}

export class RenewSubscriptionUseCase {

    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        private invoiceRepository: ISubscriptionInvoiceRepository,
        private subscriptionCalculator: SubscriptionCalculator,
        private paymentProvider: IPaymentProvider
    ) {}

    async execute({ store_id, user_id }: IRenewSubscriptionUseCaseRequest): Promise<IGenerateRenewSubscriptionPixUseCaseResponse> {

        const EXPIRATION_TIME_MS: number = 24 * 60 * 60 * 1000;

        // 1 - Buscar loja e dono
        const store = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja não encontrada", 404, "STORE_NOT_FOUND");
        if (store.plan === SubscriptionPlan.NONE) throw new AppError("Esta loja não possui um plano base para renovar.", 400, "NO_PLAN_TO_RENEW");

        const owner = await this.userRepository.findSavedUserById(user_id);
        if (!owner) throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
        if (owner.role !== UserRole.GESTOR) throw new AppError("Acesso negado: Apenas o gestor pode renovar a assinatura.", 401, "ROLE_UNAUTHORIZED");
        if (store.ownerId !== owner.id) throw new AppError("Usuário não é o proprietário da loja", 401, "MUST_BE_THE_STORE_OWNER");
        
        const rawTaxId = owner.cpf_cnpj;
        if (!rawTaxId) throw new AppError("Usuário precisa de um CPF/CNPJ para gerar cobranças.", 400, "MISSING_TAX_ID");

        if (!store.subscription_expires_at) throw new AppError("Erro grave de integração. Loja sem data de expiração", 500, "MISSING_EXPIRATION_DATE");

        // 2 - Validação da regra dos 5 dias (Matemática de Datas Segura)
        const now = new Date();
        const store_expires_at = new Date(store.subscription_expires_at);

        // Diferença normal. Se for positivo, a loja AINDA VAI VENCER. Se negativo, JÁ VENCEU.
        const diffMs = store_expires_at.getTime() - now.getTime();
        const diasFaltantes = diffMs / (1000 * 60 * 60 * 24);

        if (diasFaltantes > 5) {
            const dataRenovacao = new Date(store_expires_at);
            dataRenovacao.setDate(dataRenovacao.getDate() - 5);
            
            // Formatado considerando o fuso horário correto para a UI do cliente
            const dataFormatada = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(dataRenovacao);
            
            throw new AppError(`Renovação antecipada não permitida. Volte a partir do dia ${dataFormatada}.`, 403, "EARLY_RENEWAL_NOT_ALLOWED");
        }

        // 3 - Verificação de Idempotência
        const pendingInvoice = await this.invoiceRepository.findPendingByStoreId(store_id);

        if (pendingInvoice) {
            if (!pendingInvoice.pixCode) throw new AppError("Erro grave: Fatura pendente sem PIX Code", 500, "INVOICE_WITHOUT_PIX_CODE");

            const invoiceCreatedAt: number = new Date(pendingInvoice.createdAt).getTime();
            const isExpired: boolean = (now.getTime() - invoiceCreatedAt) >= EXPIRATION_TIME_MS;

            if(isExpired){

                const canceledInvoice: SubscriptionInvoice = pendingInvoice.markAsCanceled();
                await this.invoiceRepository.update(canceledInvoice);

            } else {

                // Assumimos que a renovação mantém o plano atual da loja
                if (pendingInvoice.planTag === store.plan) {
                    return {
                        br_code: pendingInvoice.pixCode,
                        br_code_base64: pendingInvoice.paymentUrl || "",
                        amount: pendingInvoice.amount,
                        invoice_id: pendingInvoice.id
                    };
                }

                throw new AppError("Você já possui uma fatura pendente com divergência de plano. Aguarde sua expiração.", 409, "PENDING_INVOICE_EXISTS");

            }

            
        }

        // 4 - Lógica de Base Date (O coração da renovação)
        // Se já venceu (diffMs <= 0), inicia hoje. Se não venceu (diffMs > 0), inicia no vencimento original.
        const baseDate: Date = diffMs <= 0 ? now : store_expires_at;

        const { amount_in_cents, target_date } = this.subscriptionCalculator.calculateInvoice(store.plan, baseDate);

        // 5 - Criação no Gateway (Abacate Pay)
        const invoice_id = crypto.randomUUID();
        const paymentData = await this.paymentProvider.createTransparentPix({
            amount: amount_in_cents,
            description: `Renovação ${store.plan} (1 Mês)`,
            expiresIn: EXPIRATION_TIME_MS/1000,
            customer: {
                name: owner.username,
                email: owner.email,
                taxId: rawTaxId,
                cellphone: owner.phone ? owner.phone : "(00) 00000-0000"
            },
            metadata: {
                internal_invoice_id: invoice_id
            }
        });

        // 6 - Salvando no Banco de Dados
        const build_invoice_props: BuildSubscriptionInvoiceProps = {
            now_date: now.toISOString(),
            invoice_id,
            amount_in_cents,
            store_id: store.id,
            plan_tag: store.plan,
            period_end: target_date.toISOString(),
            gateway_data: {
                gateway_invoice_id: paymentData.id,
                pix_code: paymentData.brCode,
                payment_url: paymentData.brCodeBase64 
            }
        };

        const invoice = SubscriptionInvoice.buildInvoice(build_invoice_props);
        await this.invoiceRepository.save(invoice);

        return {
            br_code: paymentData.brCode,
            br_code_base64: paymentData.brCodeBase64,
            amount: amount_in_cents,
            invoice_id: invoice.id
        };
    }
}