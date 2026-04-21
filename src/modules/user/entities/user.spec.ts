import { describe, it, expect } from 'vitest';
import { User, UserRole, type BuildUserProps } from './user.js';
import { DomainError } from '../../../shared/errors/DomainError.js';

// Constantes auxiliares para facilitar os testes
const VALID_CPF = "19244545055"; 
const VALID_CNPJ = "16528314000100"; 

// Base Props para a Factory (BuildUserProps)
const baseBuildProps: BuildUserProps = {
    user_id: "uuid-1234",
    nowDate: new Date().toISOString(),
    username: "Usuário Padrão",
    password_hash: "hashed_pass",
    role: UserRole.CAIXA,
    email: "teste@email.com",
    store_id: null,
    must_change_password: true,
    is_paying_user: false,
    cpf_cnpj: VALID_CPF,
    phone: null
};

// Base Props para o método restore (UserProps)
const baseRestoreProps = {
    user_id: "uuid-1",
    store_id: null,
    email: "test@test.com",
    username: "Tester",
    password_hash: "old_password",
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-01T10:00:00.000Z",
    role: UserRole.CAIXA,
    active: true,
    must_change_password: false,
    paying_user: false,
    cpf_cnpj: VALID_CPF,
    phone: null
};

// AAA (Arrange, Act, Assert)
describe('User Entity', () => {

    describe('Factory: buildUser', () => {

        it('Deve criar uma instância válida de User (Happy Path)', () => {
            const props: BuildUserProps = { 
                ...baseBuildProps, 
                username: "joão silva", // formato errado de proposito
                email: "joao@email.com",
                store_id: "store-999",
                phone: "81999999999"
            };

            const user = User.buildUser(props);

            expect(user.id).toBe("uuid-1234");
            expect(user.email).toBe("joao@email.com");
            expect(user.username).toBe("João Silva"); // Verifica a formatação automática
            expect(user.active).toBe(true);
            expect(user.cpf_cnpj).toBe(VALID_CPF);
        });

        it('Deve lançar DomainError se o nome de usuário for menor que 3 caracteres', () => {
            const props: BuildUserProps = { ...baseBuildProps, username: "ab" };

            expect(() => User.buildUser(props)).toThrow(DomainError);
            expect(() => User.buildUser(props)).toThrow("Nome de usuário deve ter pelo menos 3 caracteres");
        });

        it('Deve lançar DomainError se o usuário pagante não for GESTOR', () => {
             const props: BuildUserProps = { 
                ...baseBuildProps, 
                role: UserRole.VENDEDOR, 
                is_paying_user: true, 
                cpf_cnpj: VALID_CNPJ 
            };

             expect(() => User.buildUser(props)).toThrow(DomainError);
             expect(() => User.buildUser(props)).toThrow("O usuario pago necessariamente é um gestor");
        });

        it('Deve lançar DomainError se o CPF/CNPJ for inválido', () => {
            const props: BuildUserProps = { ...baseBuildProps, cpf_cnpj: "00000000000" };
           
            expect(() => User.buildUser(props)).toThrow(DomainError);
            expect(() => User.buildUser(props)).toThrow("Precisa de um CPF ou CNPJ valido");
       });

        it('Deve criar uma instância válida se receber um CNPJ válido', () => {
            const props: BuildUserProps = { ...baseBuildProps, cpf_cnpj: VALID_CNPJ };
            
            const user: User = User.buildUser(props);
            
            expect(user.cpf_cnpj).toBe(VALID_CNPJ);
        });

       it('Deve lançar DomainError se o nome de usuário ultrapassar 50 caracteres', () => {
            const props: BuildUserProps = { ...baseBuildProps, username: "A".repeat(51) };

            expect(() => User.buildUser(props)).toThrow(DomainError);
            expect(() => User.buildUser(props)).toThrow("Nome de usuário não pode ultrapassar 50 caracteres");
        });

        it('Deve formatar corretamente nomes com múltiplos espaços irregulares', () => {
            const props: BuildUserProps = { 
                ...baseBuildProps, 
                username: "   carlos    eduardo   de    almeida   " 
            };
            
            const user: User = User.buildUser(props);
            
            expect(user.username).toBe("Carlos Eduardo De Almeida");
        });

        it('Deve lancar DomainError se for um usuário pago NÃO GESTOR (CAIXA)', () => {
            const props: BuildUserProps = { 
                ...baseBuildProps, 
                role: UserRole.CAIXA, 
                is_paying_user: true 
            };

            expect(() => User.buildUser(props)).toThrow(DomainError);
            expect(() => User.buildUser(props)).toThrow("O usuario pago");
        });
    });

    describe('Setters de Estado (Imutabilidade)', () => {

        it('setNewPassword deve retornar uma nova instância sem alterar a original', () => {
            const originalUser: User = User.restore({ 
                ...baseRestoreProps, 
                role: UserRole.GESTOR, 
                paying_user: true 
            });

            const updatedUser: User = originalUser.setNewPassword("new_password");

            expect(updatedUser.passwordHash).toBe("new_password");
            expect(originalUser.passwordHash).toBe("old_password"); // A entidade original não muda!
            expect(originalUser).not.toBe(updatedUser); // Referências de memória diferentes
        });

        it('withUpdatedData deve atualizar os dados, modificar o updated_at e manter a imutabilidade', () => {
            const originalUser = User.restore({ ...baseRestoreProps, username: "Old Name" });

            const updatedUser = originalUser.withUpdatedData("New Name", "new_hash", false);

            expect(updatedUser.username).toBe("New Name");
            expect(updatedUser.passwordHash).toBe("new_hash");
            expect(updatedUser.active).toBe(false);
            
            // Garante que a data de atualização mudou e é diferente da original
            expect(updatedUser.updatedAt).not.toBe(originalUser.updatedAt);
            expect(originalUser.username).toBe("Old Name"); // Original intacto
        });

        it('withUpdatedData deve validar o novo nome de usuário', () => {
            const originalUser = User.restore({ ...baseRestoreProps });

            expect(() => originalUser.withUpdatedData("ab", "hash", true)).toThrow(DomainError);
            expect(() => originalUser.withUpdatedData("A".repeat(51), "hash", true)).toThrow(DomainError);
        });

        it('setStoreId deve retornar nova instância com o store_id atualizado', () => {
            const originalUser = User.restore({ ...baseRestoreProps });

            const updatedUser = originalUser.setStoreId("new-store-123");
            
            expect(updatedUser.storeId).toBe("new-store-123");
            expect(originalUser.storeId).toBeNull();
        });

        it('setMustChangePasswordToTrue e ToFalse devem alternar o status corretamente', () => {
            const originalUser = User.restore({ ...baseRestoreProps, must_change_password: false });

            const userNeedsToChange = originalUser.setMustChangePasswordToTrue();
            expect(userNeedsToChange.mustChangePassword).toBe(true);

            const userChanged = userNeedsToChange.setMustChangePasswordToFalse();
            expect(userChanged.mustChangePassword).toBe(false);
        });
    });
});