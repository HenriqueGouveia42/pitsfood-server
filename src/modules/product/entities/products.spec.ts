import { describe, it, expect } from 'vitest';
import { Product, type ProductProps, type BuildProductProps } from './product.js'; // Ajuste o caminho
import { DomainError } from '../../../shared/errors/DomainError.js';
import { Decimal } from 'decimal.js';

// --- Constantes de Apoio ---
const VALID_EXTERNAL_GTIN = "7894900011517"; // GTIN-13 válido (ex: Refrigerante GS1 Brasil)
const VALID_INTERNAL_GTIN = "2212345678907"; // GTIN-13 válido iniciado em 22 (Calculado)
const VALID_NOW_DATE = "2026-05-15T10:00:00.000Z";
const STORE_ID = "store-123";

// Base Props para Factory
const baseBuildProps: BuildProductProps = {
    now_date: VALID_NOW_DATE,
    product_id: "prod-001",
    name: "Produto Padrão",
    unit_price_in_reais: new Decimal(10.50),
    gtin_code: VALID_EXTERNAL_GTIN,
    is_internal: false,
    active: true,
    store_id: STORE_ID,
    track_stock: true,
    stock_quantity: 50,
    requires_preparation: false
};

// Base Props para Restore
const baseRestoreProps: ProductProps = {
    product_id: "prod-001",
    name: "PRODUTO PADRÃO",
    unit_price_in_reais: new Decimal(10.50),
    gtin_code: VALID_EXTERNAL_GTIN,
    is_internal: false,
    created_at: VALID_NOW_DATE,
    updated_at: VALID_NOW_DATE,
    active: true,
    store_id: STORE_ID,
    track_stock: true,
    stock_quantity: 50,
    requires_preparation: false
};

describe('Product Entity', () => {

    describe('Factory: buildProduct', () => {

        it('Deve criar um produto externo válido com GTIN fornecido (Happy Path)', () => {
            const props: BuildProductProps = {
                ...baseBuildProps,
                name: "coca-cola lata 350ml", // Testando formatação
                is_internal: false,
                gtin_code: VALID_EXTERNAL_GTIN,
            };

            const product = Product.buildProduct(props);

            expect(product.id).toBe("prod-001");
            expect(product.name).toBe("COCA-COLA LATA 350ML"); // Verifica ToUpperCase
            expect(product.price.equals(new Decimal(10.50))).toBe(true); // Comparação de Decimals
            expect(product.gtin).toBe(VALID_EXTERNAL_GTIN);
            expect(product.isInternal).toBe(false);
            expect(product.track_stock).toBe(true);
            expect(product.stock_quantity).toBe(50);
            expect(product.createdAt).toBe(VALID_NOW_DATE);
        });

        it('Deve criar um produto interno válido e gerar GTIN automaticamente se não fornecido', () => {
            const props: BuildProductProps = {
                ...baseBuildProps,
                name: "coxinha de frango",
                is_internal: true,
                gtin_code: null, // Sistema deve gerar sozinho
                track_stock: false,
                stock_quantity: 0,
                requires_preparation: true
            };

            const product = Product.buildProduct(props);

            expect(product.isInternal).toBe(true);
            expect(product.gtin).toBeDefined();
            expect(product.gtin.length).toBe(13);
            expect(product.gtin.startsWith("22")).toBe(true);
            expect(product.requires_preparation).toBe(true);
        });

        it('Deve remover zeros à esquerda do GTIN (Normalização)', () => {
            const props: BuildProductProps = {
                ...baseBuildProps,
                gtin_code: "0000" + VALID_EXTERNAL_GTIN
            };

            const product = Product.buildProduct(props);
            expect(product.gtin).toBe(VALID_EXTERNAL_GTIN);
        });

        // --- Regras de GTIN e Internal/External ---

        it('Deve lançar DomainError se for produto externo sem GTIN', () => {
            const props: BuildProductProps = { ...baseBuildProps, is_internal: false, gtin_code: null };
            expect(() => Product.buildProduct(props)).toThrow(DomainError);
            expect(() => Product.buildProduct(props)).toThrow("Um produto externo deve possuir um GTIN-13 informado.");
        });

        it('Deve lançar DomainError se GTIN externo começar com 22', () => {
            const props: BuildProductProps = { ...baseBuildProps, is_internal: false, gtin_code: VALID_INTERNAL_GTIN };
            expect(() => Product.buildProduct(props)).toThrow("Erro! Produto externo não pode começar com '22'");
        });

        it('Deve lançar DomainError se GTIN interno NÃO começar com 22', () => {
            const props: BuildProductProps = { ...baseBuildProps, is_internal: true, gtin_code: VALID_EXTERNAL_GTIN };
            expect(() => Product.buildProduct(props)).toThrow("Erro! Produto interno deve começar com o prefixo '22'.");
        });

        it('Deve lançar DomainError se o dígito verificador do GTIN for inválido', () => {
            const invalidGtin = "7894900011518"; // O dígito correto é 7 (ex: 7894900011517)
            const props: BuildProductProps = { ...baseBuildProps, gtin_code: invalidGtin };
            expect(() => Product.buildProduct(props)).toThrow("GTIN inválido. Dígito Verificador incorreto.");
        });

        it('Deve lançar DomainError se o tamanho do GTIN for fora do padrão GS1', () => {
            const props: BuildProductProps = { ...baseBuildProps, gtin_code: "12345" }; // 5 dígitos
            expect(() => Product.buildProduct(props)).toThrow("GTIN inválido. Tamanho recebido: 5.");
        });

        // --- Regras de Estoque e Preparo ---

        it('Deve lançar DomainError se produto exige preparo E controla estoque', () => {
            const props: BuildProductProps = { 
                ...baseBuildProps, 
                requires_preparation: true, 
                track_stock: true 
            };
            expect(() => Product.buildProduct(props)).toThrow("Um produto que precisa ser preparado nao pode ter estoque");
        });

        it('Deve lançar DomainError se produto não controla estoque mas a quantidade enviada não for zero', () => {
            const props: BuildProductProps = { 
                ...baseBuildProps, 
                track_stock: false, 
                stock_quantity: 10 // Deveria ser 0
            };
            expect(() => Product.buildProduct(props)).toThrow("Um produto que não controla estoque deve ter quantidade igual a zero.");
        });

        // --- Regras de Preço e Nome ---

        it('Deve lançar DomainError se o preço for negativo', () => {
            const props: BuildProductProps = { ...baseBuildProps, unit_price_in_reais: new Decimal(-5.00) };
            expect(() => Product.buildProduct(props)).toThrow("Preço fora da faixa permitida");
        });

        it('Deve lançar DomainError se o preço for absurdamente alto (> 1 Milhão)', () => {
            const props: BuildProductProps = { ...baseBuildProps, unit_price_in_reais: new Decimal(1000001.00) };
            expect(() => Product.buildProduct(props)).toThrow("Preço fora da faixa permitida");
        });

        it('Deve lançar DomainError se o nome ultrapassar 100 caracteres', () => {
            const props: BuildProductProps = { ...baseBuildProps, name: "A".repeat(101) };
            expect(() => Product.buildProduct(props)).toThrow("Nome muito longo");
        });
    });

    describe('Factory: restoreProduct', () => {
        it('Deve restaurar um produto validando as regras essenciais', () => {
            const product = Product.restoreProduct(baseRestoreProps);
            
            expect(product.id).toBe("prod-001");
            expect(product.name).toBe("PRODUTO PADRÃO");
            expect(product.isInternal).toBe(false);
        });

        it('Deve barrar a restauração de um produto com dados corrompidos', () => {
            const corruptedProps: ProductProps = {
                ...baseRestoreProps,
                unit_price_in_reais: new Decimal(-10) // Preço negativo corrompido no BD
            };

            expect(() => Product.restoreProduct(corruptedProps)).toThrow(DomainError);
        });
    });

    describe('State Transitions & Immutability (Pura)', () => {

        it('withUpdatedData: Deve atualizar os campos, modificar a data, formatar o nome e manter imutabilidade', () => {
            const originalProduct = Product.restoreProduct(baseRestoreProps);
            
            const newDate = "2026-06-01T10:00:00.000Z";
            const updatedProduct = originalProduct.withUpdatedData("novo nome em minúsculo", new Decimal(15.90), false, newDate);

            // Verificações do Novo Objeto
            expect(updatedProduct.name).toBe("NOVO NOME EM MINÚSCULO"); // Verifica se o UpperCase funcionou
            expect(updatedProduct.price.equals(new Decimal(15.90))).toBe(true);
            expect(updatedProduct.active).toBe(false);
            expect(updatedProduct.updatedAt).toBe(newDate);

            // Verificações do Objeto Original (Imutabilidade)
            expect(originalProduct.name).toBe("PRODUTO PADRÃO");
            expect(originalProduct.active).toBe(true);
            expect(originalProduct.updatedAt).toBe(VALID_NOW_DATE);
        });

        it('withUpdatedData: Deve lançar erro ao tentar atualizar com nome inválido', () => {
            const originalProduct = Product.restoreProduct(baseRestoreProps);
            const newDate = "2026-06-01T10:00:00.000Z";

            expect(() => originalProduct.withUpdatedData("A".repeat(101), new Decimal(10), true, newDate))
                .toThrow("Nome muito longo");
        });
    });
});