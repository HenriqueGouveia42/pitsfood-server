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
        store_id: string;
        must_change_password: boolean;
        is_paying_user: boolean;
        token_version: number;
    };
    
    preAuthUserId?: string;
}

export interface IHttpResponse {
    statusCode: number;
    body: any;
    cookies?: ICookie[];
}

export interface IController {
    handle(req: IHttpRequest): Promise<IHttpResponse>;
}