export class DomainError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'DOMAIN_ERROR') {
    super(message);
    
    this.name = 'DomainError';
    this.code = code;

    // Garante que o instanceof funcione corretamente mesmo transpilado
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}