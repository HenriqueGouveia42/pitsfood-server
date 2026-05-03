import { DomainError } from "../../../shared/errors/DomainError.js"

export type PasswordResetTokenProps = {
    readonly id: string,
    readonly user_id: string,
    readonly token: string,
    readonly expires_at: string,
    readonly created_at: string
    readonly failed_attempts: number,
}

export type BuildPasswordResetTokenProps = {
    id: string,
    user_id: string,
    token: string,
    now: string
}

export const TEN_MINUTES_IN_MS: number = 10 * 60 * 1000;

export class PasswordResetToken{
    private constructor(private readonly props: PasswordResetTokenProps){}

    private static validatePasswordResetToken(password_token: string){
        if (password_token.length != 6) throw new DomainError("Tamanho de codigo de confirmacao invalido", "INVALID_LENGHT");

       
        var numericRepr: number = parseFloat(password_token);

        if (isNaN(numericRepr)) throw new DomainError("Codigo invalido");
        
    }

    public static buildPasswordResetToken(build_props: BuildPasswordResetTokenProps): PasswordResetToken{

        this.validatePasswordResetToken(build_props.token);

        const now_date: Date = new Date(build_props.now);

        const expires_at: string = new Date(now_date.getTime() + TEN_MINUTES_IN_MS).toISOString()

        return new PasswordResetToken({
            id: build_props.id,
            user_id: build_props.user_id,
            token: build_props.token,
            created_at: build_props.now,
            expires_at,
            failed_attempts: 0
        })

    }

    public static restore(props: PasswordResetTokenProps): PasswordResetToken{
        return new PasswordResetToken(props)
    } 

    get id() { return this.props.id; }
    get user_id() { return this.props.user_id; }
    get token() { return this.props.token; }
    get created_at() { return this.props.created_at }
    get expires_at() { return this.props.expires_at; }
    get failed_attempts() { return this.props.failed_attempts }
}

