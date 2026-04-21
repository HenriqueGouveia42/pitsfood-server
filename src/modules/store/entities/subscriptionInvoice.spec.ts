import { describe, it, expect } from 'vitest';
import { SubscriptionInvoice, InvoiceStatus, type SubscriptionInvoiceProps, type BuildSubscriptionInvoiceProps } from './subscriptionInvoice.js'
import { SubscriptionPlan } from './store.js';
import { DomainError } from '../../../shared/errors/DomainError.js';

// --- Constantes de Apoio ---
const VALID_STORE_ID = "store-uuid-123";
const VALID_PERIOD_END = "2026-05-21T10:00:00.000Z";
const VALID_NOW_DATE = "2026-04-21T12:00:00.000Z";
const VALID_AMOUNT_CENTS = 4990; // R$ 49,90

// Base Props para a Factory (BuildProps)
const baseBuildProps: BuildSubscriptionInvoiceProps = {
    now_date: VALID_NOW_DATE,
    invoice_id: "invoice-uuid-001",
    amount_in_cents: VALID_AMOUNT_CENTS,
    store_id: VALID_STORE_ID,
    plan_tag: SubscriptionPlan.BASIC,
    period_end: VALID_PERIOD_END
};

// Base Props para o restore
const baseRestoreProps: SubscriptionInvoiceProps = {
    invoice_id: "invoice-uuid-999",
    amount_in_cents: VALID_AMOUNT_CENTS,
    currency: "BRL",
    status: InvoiceStatus.PENDING,
    gateway_invoice_id: null,
    pix_code: null,
    payment_url: null,
    created_at: VALID_NOW_DATE,
    paid_at: null,
    period_end: VALID_PERIOD_END,
    store_id: VALID_STORE_ID,
    plan_tag: SubscriptionPlan.BASIC
};

describe('SubscriptionInvoice Entity', () => {

    describe('Factory: buildInvoice (Entidade Pura)', () => {

        it('Deve criar uma fatura válida sem dados do gateway (Happy Path)', () => {
            const invoice = SubscriptionInvoice.buildInvoice(baseBuildProps);

            expect(invoice.id).toBe("invoice-uuid-001");
            expect(invoice.amount).toBe(4990);
            expect(invoice.status).toBe(InvoiceStatus.PENDING);
            expect(invoice.storeId).toBe(VALID_STORE_ID);
            expect(invoice.planTag).toBe(SubscriptionPlan.BASIC);
            expect(invoice.createdAt).toBe(VALID_NOW_DATE); 
            expect(invoice.pixCode).toBeNull();
        });

        it('Deve criar uma fatura válida com dados do gateway injetados', () => {
            const props: BuildSubscriptionInvoiceProps = {
                ...baseBuildProps,
                gateway_data: {
                    gateway_invoice_id: "gw-123",
                    pix_code: "00020101021126580014br...",
                    payment_url: "https://pay.abacate.com/123"
                }
            };

            const invoice = SubscriptionInvoice.buildInvoice(props);

            expect(invoice.pixCode).toBe("00020101021126580014br...");
            expect(invoice.paymentUrl).toBe("https://pay.abacate.com/123");
            expect(invoice.getProps.gateway_invoice_id).toBe("gw-123");
        });

        it('Deve lançar DomainError se o plano for NONE', () => {
            const props: BuildSubscriptionInvoiceProps = { ...baseBuildProps, plan_tag: SubscriptionPlan.NONE };
            
            expect(() => SubscriptionInvoice.buildInvoice(props)).toThrow(DomainError);
            expect(() => SubscriptionInvoice.buildInvoice(props)).toThrow("Não é possível gerar uma fatura para o plano 'NONE'");
        });

        // --- Edge Cases de Valores Financeiros ---

        it('Deve lançar DomainError se o valor for zero', () => {
            const props: BuildSubscriptionInvoiceProps = { ...baseBuildProps, amount_in_cents: 0 };
            expect(() => SubscriptionInvoice.buildInvoice(props)).toThrow("O valor da fatura deve ser maior que zero.");
        });

        it('Deve lançar DomainError se o valor for negativo', () => {
            const props: BuildSubscriptionInvoiceProps = { ...baseBuildProps, amount_in_cents: -1000 };
            expect(() => SubscriptionInvoice.buildInvoice(props)).toThrow("O valor da fatura deve ser maior que zero.");
        });

        it('Deve lançar DomainError se o valor não for um número inteiro (proteção contra float)', () => {
            const props: BuildSubscriptionInvoiceProps = { ...baseBuildProps, amount_in_cents: 49.90 };
            expect(() => SubscriptionInvoice.buildInvoice(props)).toThrow("O valor da fatura deve ser um número inteiro (centavos).");
        });
    });

    describe('State Transitions & Immutability', () => {

        describe('Method: markAsPaid', () => {
            it('Deve alterar o status para PAID, preencher paid_at com a data injetada e manter imutabilidade', () => {
                const originalInvoice = SubscriptionInvoice.restore(baseRestoreProps);
                const paymentDate = "2026-04-22T15:30:00.000Z";
                
                const paidInvoice = originalInvoice.markAsPaid(paymentDate);

                expect(paidInvoice.status).toBe(InvoiceStatus.PAID);
                expect(paidInvoice.paidAt).toBe(paymentDate);
                
                // Garantir que o original não foi mutado
                expect(originalInvoice.status).toBe(InvoiceStatus.PENDING);
                expect(originalInvoice.paidAt).toBeNull();
                expect(originalInvoice).not.toBe(paidInvoice);
            });

            it('Idempotência: Se já estiver PAID, deve retornar a própria instância ignorando a nova data', () => {
                const originalPaymentDate = "2026-04-20T00:00:00.000Z";
                const alreadyPaidInvoice = SubscriptionInvoice.restore({
                    ...baseRestoreProps,
                    status: InvoiceStatus.PAID,
                    paid_at: originalPaymentDate
                });

                const duplicateWebhookCallDate = "2026-04-25T00:00:00.000Z";

                const resultInvoice = alreadyPaidInvoice.markAsPaid(duplicateWebhookCallDate);

                // Referência na memória deve ser exatamente a mesma (early return)
                expect(resultInvoice).toBe(alreadyPaidInvoice);
                
                // A data original deve ser rigorosamente mantida
                expect(resultInvoice.paidAt).toBe(originalPaymentDate);
            });
        });

        describe('Method: markAsFailed', () => {
            it('Deve alterar status para FAILED e manter imutabilidade', () => {
                const originalInvoice = SubscriptionInvoice.restore(baseRestoreProps);
                const failedInvoice = originalInvoice.markAsFailed();

                expect(failedInvoice.status).toBe(InvoiceStatus.FAILED);
                expect(originalInvoice.status).toBe(InvoiceStatus.PENDING);
            });
        });

        describe('Method: markAsCanceled', () => {
            it('Deve alterar status para CANCELED se estiver PENDING', () => {
                const originalInvoice = SubscriptionInvoice.restore(baseRestoreProps);
                const canceledInvoice = originalInvoice.markAsCanceled();

                expect(canceledInvoice.status).toBe(InvoiceStatus.CANCELED);
            });

            it('Deve lançar DomainError ao tentar cancelar uma fatura que já foi PAID', () => {
                const paidInvoice = SubscriptionInvoice.restore({ ...baseRestoreProps, status: InvoiceStatus.PAID });
                
                expect(() => paidInvoice.markAsCanceled()).toThrow(DomainError);
                expect(() => paidInvoice.markAsCanceled()).toThrow("Apenas faturas pendentes podem ser canceladas.");
            });

            it('Deve lançar DomainError ao tentar cancelar uma fatura que já é FAILED', () => {
                const failedInvoice = SubscriptionInvoice.restore({ ...baseRestoreProps, status: InvoiceStatus.FAILED });
                expect(() => failedInvoice.markAsCanceled()).toThrow("Apenas faturas pendentes podem ser canceladas.");
            });
        });
    });

    describe('Method: addGatewayDetails', () => {
        it('Deve adicionar os detalhes do gateway e manter a imutabilidade', () => {
            const originalInvoice = SubscriptionInvoice.restore(baseRestoreProps);
            
            const updatedInvoice = originalInvoice.addGatewayDetails(
                "new-gw-id",
                "new-pix-code",
                "https://new-url.com"
            );

            expect(updatedInvoice.getProps.gateway_invoice_id).toBe("new-gw-id");
            expect(updatedInvoice.pixCode).toBe("new-pix-code");
            expect(updatedInvoice.paymentUrl).toBe("https://new-url.com");

            expect(originalInvoice.pixCode).toBeNull(); // Objeto antigo inalterado
        });
    });
});