export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(message: string, statusCode: number = 400, errorCode: string = 'APP_ERROR') {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // Garante que o instanceof funcione corretamente mesmo transpiliado
    Object.setPrototypeOf(this, AppError.prototype);
  }
}