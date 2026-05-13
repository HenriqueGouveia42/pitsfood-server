import { describe, it, expect } from 'vitest';
import { PasswordResetToken } from './passwordResetToken.js';
import type { BuildPasswordResetTokenProps, PasswordResetTokenProps } from "./passwordResetToken.js"
import { DomainError } from '../../../shared/errors/DomainError.js';

describe('PasswordResetToken Entity', () => {

  const validBuildProps: BuildPasswordResetTokenProps = {
    id: 'token-uuid-123',
    user_id: 'user-uuid-456',
    password_reset_code: '123456',
    password_reset_expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // Expira em 1 hora
  };

  describe('buildPasswordResetToken', () => {
    
    it('deve criar um token com sucesso quando as propriedades forem válidas', () => {
      const token = PasswordResetToken.buildPasswordResetToken(validBuildProps);

      expect(token).toBeInstanceOf(PasswordResetToken);
      expect(token.id).toBe(validBuildProps.id);
      expect(token.user_id).toBe(validBuildProps.user_id);
      expect(token.password_reset_code).toBe(validBuildProps.password_reset_code);
      expect(token.password_reset_expires_at).toBe(validBuildProps.password_reset_expires_at);
      
      // Quando recém construído, failed_attempts DEVE ser zero
      expect(token.failed_attempts).toBe(0);
    });

    it('deve lançar DomainError se o código tiver menos de 6 caracteres', () => {
      const invalidProps = { ...validBuildProps, password_reset_code: '12345' };

      expect(() => PasswordResetToken.buildPasswordResetToken(invalidProps))
        .toThrow(DomainError);
        
      expect(() => PasswordResetToken.buildPasswordResetToken(invalidProps))
        .toThrow('Tamanho de codigo de confirmacao invalido');
    });

    it('deve lançar DomainError se o código tiver mais de 6 caracteres', () => {
      const invalidProps = { ...validBuildProps, password_reset_code: '1234567' };

      expect(() => PasswordResetToken.buildPasswordResetToken(invalidProps))
        .toThrow(DomainError);

      expect(() => PasswordResetToken.buildPasswordResetToken(invalidProps))
        .toThrow('Tamanho de codigo de confirmacao invalido');
    });

    it('deve lançar DomainError se o código não puder ser convertido para número (NaN)', () => {
      const invalidProps = { ...validBuildProps, password_reset_code: 'abcdef' };

      expect(() => PasswordResetToken.buildPasswordResetToken(invalidProps))
        .toThrow(DomainError);

      expect(() => PasswordResetToken.buildPasswordResetToken(invalidProps))
        .toThrow('Codigo invalido');
    });

  });

  describe('restore', () => {

    it('deve restaurar um token existente repassando todas as propriedades exatas', () => {
      const restoreProps: PasswordResetTokenProps = {
        id: 'token-uuid-123',
        user_id: 'user-uuid-456',
        password_reset_code: '654321',
        password_reset_expires_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // Já expirado no passado
        failed_attempts: 3, // Restaurando com tentativas já falhas
      };

      const token = PasswordResetToken.restore(restoreProps);

      expect(token).toBeInstanceOf(PasswordResetToken);
      expect(token.id).toBe(restoreProps.id);
      expect(token.user_id).toBe(restoreProps.user_id);
      expect(token.password_reset_code).toBe(restoreProps.password_reset_code);
      expect(token.password_reset_expires_at).toBe(restoreProps.password_reset_expires_at);
      expect(token.failed_attempts).toBe(restoreProps.failed_attempts);
    });

    it('deve restaurar o token sem passar pela validação de tamanho do código', () => {
      
      const restoreProps: PasswordResetTokenProps = {
        id: 'token-uuid-123',
        user_id: 'user-uuid-456',
        password_reset_code: '123', // Tamanho inválido para o build, mas válido para o restore
        password_reset_expires_at: new Date().toISOString(),
        failed_attempts: 1,
      };

      // Não deve lançar erro
      const token = PasswordResetToken.restore(restoreProps);
      expect(token.password_reset_code).toBe('123');
    });

  });

});