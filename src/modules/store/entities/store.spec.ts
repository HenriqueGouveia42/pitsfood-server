import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Store, SubscriptionPlan, SubscriptionStatus, type StoreProps, type BuildStoreProps } from './store.js';
import { DomainError } from '../../../shared/errors/DomainError.js';

// Constantes auxiliares
const VALID_CNPJ = "16528314000100";
const INVALID_CNPJ = "00000000000000";

// Base Props para a Factory (BuildStoreProps)
const baseBuildProps: BuildStoreProps = {
    store_id: "store-uuid-123",
    now_date: new Date().toISOString(),
    name: "Loja Padrão",
    active: true,
    cnpj: VALID_CNPJ,
    owner_id: "owner-uuid-456",
    store_icon_url: null,
    affiliate_id: null
};

// Base Props para o método restore (Facilita o Arrange dos testes de mutação)
const baseStoreProps: StoreProps = {
    store_id: "store-uuid-123",
    name: "Loja Padrão",
    cnpj: VALID_CNPJ,
    active: true,
    owner_id: "owner-uuid-456",
    affiliate_id: null,
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-01T10:00:00.000Z",
    plan: SubscriptionPlan.NONE,
    subscription_status: SubscriptionStatus.NONE,
    store_icon_url: null,
    subscription_expires_at: null,
    billing_day: null
};

describe('Store Entity', () => {

    describe('Factory: buildStore', () => {

        it('Deve criar uma Store válida com CNPJ e sem ícone (Happy Path)', () => {
            const props: BuildStoreProps = {
                ...baseBuildProps,
                name: "minha loja legal" // Testando a formatação
            };
            
            const store = Store.buildStore(props);

            expect(store.id).toBe("store-uuid-123");
            expect(store.name).toBe("Minha Loja Legal"); // Title Case aplicado pela entidade
            expect(store.active).toBe(true);
            expect(store.cnpj).toBe(VALID_CNPJ);
            expect(store.plan).toBe(SubscriptionPlan.NONE);
            expect(store.subscription_status).toBe(SubscriptionStatus.NONE);
            expect(store.affiliate_id).toBeNull(); // Mudou para snake_case no getter se não definiu getter específico
        });

        it('Deve criar uma Store válida com um afiliado vinculado', () => {
            const props: BuildStoreProps = { ...baseBuildProps, affiliate_id: "affiliate-999" };
            const store = Store.buildStore(props);

            expect(store.getProps.affiliate_id).toBe("affiliate-999");
        });

        it('Deve criar uma Store válida sem CNPJ e com ícone seguro', () => {
            const props: BuildStoreProps = { 
                ...baseBuildProps, 
                cnpj: null, 
                store_icon_url: "https://img.com/icon.png" 
            };
            const store = Store.buildStore(props);

            expect(store.cnpj).toBeNull();
            expect(store.store_icon_url).toBe("https://img.com/icon.png");
        });

        it('Deve lançar DomainError se o nome tiver menos de 3 caracteres visíveis', () => {
            const props: BuildStoreProps = { ...baseBuildProps, name: " a " };
            expect(() => Store.buildStore(props)).toThrow(DomainError);
            expect(() => Store.buildStore(props)).toThrow("O nome da loja deve ter no mínimo 3 caracteres.");
        });

        it('Deve lançar DomainError se o nome tiver mais de 100 caracteres', () => {
            const props: BuildStoreProps = { ...baseBuildProps, name: "A".repeat(101) };
            expect(() => Store.buildStore(props)).toThrow(DomainError);
        });

        it('Deve lançar DomainError se a URL do ícone não for HTTPS', () => {
            const props: BuildStoreProps = { ...baseBuildProps, store_icon_url: "http://inseguro.com/img.png" };
            expect(() => Store.buildStore(props)).toThrow("A URL da imagem deve ser segura (HTTPS).");
        });

        it('Deve lançar DomainError se a URL do ícone for inválida', () => {
            const props: BuildStoreProps = { ...baseBuildProps, store_icon_url: "nao-sou-uma-url" };
            expect(() => Store.buildStore(props)).toThrow("A URL do ícone fornecida é inválida.");
        });

        it('Deve lançar DomainError se o CNPJ for inválido', () => {
            const props: BuildStoreProps = { ...baseBuildProps, cnpj: INVALID_CNPJ };
            expect(() => Store.buildStore(props)).toThrow("CNPJ invalido");
        });

        it('Deve formatar corretamente nomes com múltiplos espaços', () => {
            const props: BuildStoreProps = { ...baseBuildProps, name: "  loja    com    espacos  " };
            const store = Store.buildStore(props);
            
            expect(store.name).toBe("Loja Com Espacos");
        });
    });

    describe('Method: rename (Imutabilidade e Regras)', () => {

        it('Deve atualizar o nome aplicando formatação e validação', () => {
            const originalStore = Store.restore(baseStoreProps);
            const updatedStore = originalStore.rename("novo nome da loja");

            expect(updatedStore.name).toBe("Novo Nome Da Loja");
            expect(originalStore.name).toBe("Loja Padrão");
        });

        it('Deve lançar erro ao tentar renomear para um nome inválido (< 3 caracteres)', () => {
            const originalStore = Store.restore(baseStoreProps);
            expect(() => originalStore.rename("ab")).toThrow(DomainError);
        });
    });

    describe('Method: updateIcon', () => {
        
        it('Deve atualizar o ícone e modificar a data de atualização', () => {
            const originalStore = Store.restore(baseStoreProps);
            const updatedStore = originalStore.updateIcon("https://novosite.com/icon.png");

            expect(updatedStore.store_icon_url).toBe("https://novosite.com/icon.png");
            expect(updatedStore.updatedAt).not.toBe(originalStore.updatedAt);
        });

        it('Deve validar a segurança do novo ícone no momento da atualização', () => {
            const originalStore = Store.restore(baseStoreProps);
            expect(() => originalStore.updateIcon("http://inseguro.com")).toThrow(DomainError);
        });
    });

    describe('Method: activatePlan (Rolling Billing & Timers)', () => {
        beforeEach(() => { vi.useFakeTimers(); });
        afterEach(() => { vi.useRealTimers(); });

        it('Deve lançar erro ao tentar ativar um plano NONE', () => {
            const store = Store.restore(baseStoreProps);
            const futureDate = new Date("2026-12-31T00:00:00Z");
            
            expect(() => store.activatePlan(SubscriptionPlan.NONE, futureDate)).toThrow("Não é possivel ativar uma loja com o plano 'None'");
        });

        it('Primeira assinatura: deve definir status ACTIVE e pegar o dia atual como billing_day', () => {
            const store = Store.restore({ ...baseStoreProps, subscription_status: SubscriptionStatus.NONE, billing_day: null });
            
            vi.setSystemTime(new Date(2026, 5, 15)); 
            const expireDate = new Date(2026, 6, 15);

            const activatedStore = store.activatePlan(SubscriptionPlan.BASIC, expireDate);

            expect(activatedStore.subscription_status).toBe(SubscriptionStatus.ACTIVE);
            expect(activatedStore.plan).toBe(SubscriptionPlan.BASIC);
            expect(activatedStore.billing_day).toBe(15);
            expect(activatedStore.subscription_expires_at).toBe(expireDate.toISOString());
        });

        it('Proteção do bug de Fevereiro: se ativar dia 31, o billing_day deve ser 28', () => {
            const store = Store.restore({ ...baseStoreProps, subscription_status: SubscriptionStatus.NONE, billing_day: null });
            
            vi.setSystemTime(new Date(2026, 0, 31)); 
            const expireDate = new Date(2026, 1, 28);

            const activatedStore = store.activatePlan(SubscriptionPlan.PREMIUM, expireDate);

            expect(activatedStore.billing_day).toBe(28); 
        });

        it('Upgrade/Downgrade: Se já estiver ACTIVE, deve manter o billing_day original', () => {
            const store = Store.restore({ 
                ...baseStoreProps, 
                plan: SubscriptionPlan.BASIC,
                subscription_status: SubscriptionStatus.ACTIVE, 
                billing_day: 10 
            });
            
            vi.setSystemTime(new Date(2026, 5, 20)); 
            const expireDate = new Date(2026, 6, 10);

            const upgradedStore = store.activatePlan(SubscriptionPlan.PREMIUM, expireDate);

            expect(upgradedStore.plan).toBe(SubscriptionPlan.PREMIUM);
            expect(upgradedStore.billing_day).toBe(10); 
        });

        it('Reativação: Se estava PAST_DUE, deve resetar o ciclo para o dia de hoje', () => {
            const store = Store.restore({ 
                ...baseStoreProps, 
                plan: SubscriptionPlan.BASIC,
                subscription_status: SubscriptionStatus.PAST_DUE, 
                billing_day: 5 
            });
            
            vi.setSystemTime(new Date(2026, 5, 22)); 
            const expireDate = new Date(2026, 6, 22);

            const reactivatedStore = store.activatePlan(SubscriptionPlan.BASIC, expireDate);

            expect(reactivatedStore.subscription_status).toBe(SubscriptionStatus.ACTIVE);
            expect(reactivatedStore.billing_day).toBe(22); 
        });
    });

    describe('Method: markAsPastDue', () => {
        it('Deve alterar status para PAST_DUE e atualizar updated_at', () => {
            const originalStore = Store.restore({ 
                ...baseStoreProps, 
                plan: SubscriptionPlan.BASIC, 
                subscription_status: SubscriptionStatus.ACTIVE 
            });
            
            const pastDueStore = originalStore.markAsPastDue();

            expect(pastDueStore.subscription_status).toBe(SubscriptionStatus.PAST_DUE);
            expect(pastDueStore.updatedAt).not.toBe(originalStore.updatedAt);
        });
    });
});