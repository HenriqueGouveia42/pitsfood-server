import { describe, it, expect } from 'vitest';
import { Sale, SaleStatus, PaymentMethod, type SalePaymentProp, type SaleProductProp } from './sale.js';
import { UserRole } from '../../user/entities/user.js'; // Ajuste o path
import { DomainError } from '../../../shared/errors/DomainError.js';
import { Decimal } from 'decimal.js';

// --- Constantes Base ---
const STORE_ID = "store-123";
const USER_ID = "user-456";
const SALE_ID = "sale-789";
const VALID_NOW_DATE = "2026-05-15T10:00:00.000Z";

// Helper para criar um Produto da Venda (Valor Total = 50.00)
const createMockItem = (quantity: number = 2, price: number = 25.00): SaleProductProp => ({
    sale_product_id: "item-1",
    quantity: quantity,
    unit_price_snapshot: new Decimal(price),
    product_name_snapshot: "Produto Teste",
    product_gtin_snapshot: "1234567890123",
    store_id: STORE_ID,
    sale_id: SALE_ID,
    product_id: "prod-1"
});

// Helper para criar Pagamento
const createMockPayment = (method: PaymentMethod, amount: number): SalePaymentProp => ({
    sale_payment_id: crypto.randomUUID(),
    amount: new Decimal(amount),
    method: method,
    sale_id: SALE_ID
});

describe('Sale Entity', () => {

    describe('Factory: buildSale', () => {

        it('Deve criar uma venda válida com pagamento exato (Happy Path)', () => {
            const items = [createMockItem(2, 25.00)]; // Total: 50.00
            const payments = [createMockPayment(PaymentMethod.PIX, 50.00)];

            const sale = Sale.buildSale({
                store_id: STORE_ID, user_id: USER_ID, sale_id: SALE_ID,
                seller_name: "João Caixa", seller_role: UserRole.CAIXA,
                now_string: VALID_NOW_DATE, items, payments
            });

            expect(sale.id).toBe(SALE_ID);
            expect(sale.status).toBe(SaleStatus.CONCLUIDA);
            expect(sale.total.equals(new Decimal(50.00))).toBe(true);
            expect(sale.amountPaid.equals(new Decimal(50.00))).toBe(true);
            expect(sale.sellerName).toBe("João Caixa");
        });

        it('Deve lançar DomainError se tentar criar uma venda sem itens', () => {
            expect(() => Sale.buildSale({
                store_id: STORE_ID, user_id: USER_ID, sale_id: SALE_ID,
                seller_name: "João", seller_role: UserRole.CAIXA,
                now_string: VALID_NOW_DATE, items: [], payments: []
            })).toThrow("Não é possível criar uma venda sem itens.");
        });

        // --- Regras de Pagamento e Totais ---

        it('Deve lançar DomainError se o pagamento for insuficiente', () => {
            const items = [createMockItem(1, 50.00)]; // Total: 50.00
            const payments = [createMockPayment(PaymentMethod.ESPECIE, 40.00)]; // Pagou só 40

            expect(() => Sale.buildSale({
                store_id: STORE_ID, user_id: USER_ID, sale_id: SALE_ID,
                seller_name: "João", seller_role: UserRole.CAIXA,
                now_string: VALID_NOW_DATE, items, payments
            })).toThrow("Pagamento menor do que o valor da conta");
        });

        // --- A Regra de Ouro do Troco ---

        it('Sucesso: Pagamento em espécie maior que o total (Gera Troco Válido)', () => {
            const items = [createMockItem(1, 40.00)]; // Total: 40
            const payments = [createMockPayment(PaymentMethod.ESPECIE, 50.00)]; // Pagou 50, troco de 10

            const sale = Sale.buildSale({
                store_id: STORE_ID, user_id: USER_ID, sale_id: SALE_ID,
                seller_name: "João", seller_role: UserRole.CAIXA,
                now_string: VALID_NOW_DATE, items, payments
            });

            expect(sale.total.equals(new Decimal(40.00))).toBe(true);
            expect(sale.amountPaid.equals(new Decimal(50.00))).toBe(true);
        });

        it('Sucesso: Pagamento Misto (PIX + Espécie) onde o troco sai do dinheiro físico', () => {
            const items = [createMockItem(1, 100.00)]; // Total: 100
            
            // O cliente passou 80 no PIX e deu uma nota de 50 (Total pago = 130)
            // Troco = 30. Como ele deu 50 em dinheiro, o caixa tem de onde tirar o troco. Válido!
            const payments = [
                createMockPayment(PaymentMethod.PIX, 80.00),
                createMockPayment(PaymentMethod.ESPECIE, 50.00)
            ];

            const sale = Sale.buildSale({
                store_id: STORE_ID, user_id: USER_ID, sale_id: SALE_ID,
                seller_name: "João", seller_role: UserRole.CAIXA,
                now_string: VALID_NOW_DATE, items, payments
            });

            expect(sale.total.equals(new Decimal(100.00))).toBe(true);
            expect(sale.amountPaid.equals(new Decimal(130.00))).toBe(true);
        });

        it('Falha: Pagamento Misto onde o troco exigido é maior que o valor dado em espécie', () => {
            const items = [createMockItem(1, 100.00)]; // Total: 100
            
            // O cliente passou 100 no PIX (já pagou tudo) e por engano o caixa registrou +20 em dinheiro.
            // Troco exigido = 20. Valor em espécie = 20. Troco (20) NÃO é maior que Espécie (20). ISSO DEVE PASSAR.
            
            // Agora o cenário de falha: Cliente pagou 110 no Cartão e deu 10 em Espécie (Total pago 120).
            // Troco exigido = 20. Valor em espécie = 10. Erro! O caixa não pode devolver dinheiro do cartão.
            const payments = [
                createMockPayment(PaymentMethod.CARTAO_CREDITO, 110.00),
                createMockPayment(PaymentMethod.ESPECIE, 10.00)
            ];

            expect(() => Sale.buildSale({
                store_id: STORE_ID, user_id: USER_ID, sale_id: SALE_ID,
                seller_name: "João", seller_role: UserRole.CAIXA,
                now_string: VALID_NOW_DATE, items, payments
            })).toThrow("O valor do troco não pode ser maior que o valor pago em espécie.");
        });

        it('Falha: Troco puro em PIX/Cartão', () => {
            const items = [createMockItem(1, 40.00)]; // Total: 40
            const payments = [createMockPayment(PaymentMethod.PIX, 50.00)]; // Pagou 50 no PIX

            expect(() => Sale.buildSale({
                store_id: STORE_ID, user_id: USER_ID, sale_id: SALE_ID,
                seller_name: "João", seller_role: UserRole.CAIXA,
                now_string: VALID_NOW_DATE, items, payments
            })).toThrow("O valor do troco não pode ser maior que o valor pago em espécie.");
        });
    });

    describe('State Transitions & Immutability (Pura)', () => {

        it('withCancelledStatus: Deve alterar status para CANCELADA, atualizar data e manter imutabilidade', () => {
            // Criamos a venda base
            const originalSale = Sale.buildSale({
                store_id: STORE_ID, user_id: USER_ID, sale_id: SALE_ID,
                seller_name: "João", seller_role: UserRole.CAIXA,
                now_string: VALID_NOW_DATE, 
                items: [createMockItem(1, 10.00)], 
                payments: [createMockPayment(PaymentMethod.ESPECIE, 10.00)]
            });

            const cancelDate = "2026-05-16T15:00:00.000Z";

            // ASSUMIMOS QUE VOCÊ REFATOROU O MÉTODO PARA RECEBER cancelDate
            const cancelledSale = originalSale.withCancelledStatus(cancelDate);

            // Verificações da Nova Instância
            expect(cancelledSale.status).toBe(SaleStatus.CANCELADA);
            expect(cancelledSale.updatedAt).toBe(cancelDate);

            // Garantia de Imutabilidade do Objeto Original
            expect(originalSale.status).toBe(SaleStatus.CONCLUIDA);
            expect(originalSale.updatedAt).toBe(VALID_NOW_DATE);
        });

        it('withCancelledStatus: Deve lançar DomainError se a venda já estiver cancelada', () => {
            const originalSale = Sale.buildSale({ /* ... props básicas ... */
                store_id: STORE_ID, user_id: USER_ID, sale_id: SALE_ID,
                seller_name: "João", seller_role: UserRole.CAIXA, now_string: VALID_NOW_DATE, 
                items: [createMockItem(1, 10.00)], payments: [createMockPayment(PaymentMethod.ESPECIE, 10.00)]
            });

            // Cancela a primeira vez
            const cancelledSale = originalSale.withCancelledStatus("2026-05-16T15:00:00.000Z");

            // Tenta cancelar de novo a partir do objeto já cancelado
            expect(() => cancelledSale.withCancelledStatus("2026-05-17T15:00:00.000Z"))
                .toThrow("Apenas vendas concluídas podem ser canceladas.");
        });
    });
});