import type { UserRole } from "../../../modules/user/entities/user.js";

export interface ICookieOptions {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    path?: string;
}

export interface ICookie {
    name: string;
    value: string;
    options?: ICookieOptions;
}

export interface IHttpRequest<B = any, P = any, Q = any> {
    body?: B;
    params?: P;
    query?: Q;
    headers?: Record<string, string | string[] | undefined>;
    
    user?: {
        id: string;
        role: UserRole;
        store_id: string; // Nota: No IsLoggedInController você esperava string | null. Se for string | null na regra de negócio, ajuste aqui.
        must_change_password: boolean;
        is_paying_user: boolean;
        token_version: number;
    };
    
    preAuthUserId?: string;
}

// Para controllers protegidos (como IsLoggedInController)
export interface IAuthenticatedHttpRequest<B = any, P = any, Q = any> extends IHttpRequest<B, P, Q> {
    user: { // AQUI O USER É OBRIGATORIO
        id: string;
        role: UserRole;
        store_id: string;
        must_change_password: boolean;
        is_paying_user: boolean;
        token_version: number;
    };
}

// Para o fluxo de 2FA, Controller de selecao de loja, etc (como ConfirmDeviceController)
export interface IPreAuthHttpRequest<B = any, P = any, Q = any> extends IHttpRequest<B, P, Q> {
    preAuthUserId: string;
}

// Para forçar um Body específico 
export interface IValidatedHttpRequest<B, P = any, Q = any> extends IHttpRequest<B, P, Q> {
    body: B; // Body obrigatório e tipado
}


export interface IHttpResponse {
    statusCode: number;
    body: any;
    cookies?: ICookie[];
}

export interface IController {
    // A interface do controller base continua recebendo a interface mais ampla, 
    // permitindo que cada Controller específico estreite o tipo localmente no seu 'handle'
    handle(req: IHttpRequest): Promise<IHttpResponse>;
}