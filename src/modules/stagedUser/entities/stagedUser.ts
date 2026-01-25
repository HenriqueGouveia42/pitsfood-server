import { AppError } from "../../../shared/errors/AppError.js";


export type StagedUserProps = {
    readonly id: string,
    readonly email: string,
    readonly username: string,
    readonly password_hash: string,
    readonly verification_code: string,
    readonly created_at: string
    readonly expires_at: string,
}

export class StagedUser{

    private constructor(private readonly props: StagedUserProps){}

    //validacoes
    private static validateUsername(username: string): void {
        if (username.length < 3) throw new AppError("Nome de usuário temporario deve ter pelo menos 3 caracteres", 422, "INVALID_TEMP_USER");
        if (username.length > 50) throw new AppError("Nome de usuário temporario não pode ultrapassar 50 caracteres", 422, "INVALID_TEMP_USER");
    }

    private static validateEmail(email: string): void {

        if (!email) {
            throw new AppError("O email é obrigatório", 422, "INVALID_TEMP_USER");
        }
        
        if (email.length > 255) {
             throw new AppError("O email é muito longo", 422, "INVALID_TEMP_USER");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            throw new AppError("Formato de email inválido", 422, "INVALID_TEMP_USER");
        }
    }

    private static validateVerificationCode(code: string): void {
        if (!code) {
            throw new AppError("O código de verificação é obrigatório", 422, "INVALID_TEMP_USER");
        }

        if (code.length !== 6) {
            throw new AppError("O código de verificação deve ter exatamente 6 dígitos", 422, "INVALID_TEMP_USER");
        }

        const onlyNumbersRegex = /^\d+$/;

        if (!onlyNumbersRegex.test(code)) {
            throw new AppError("O código de verificação deve conter apenas números", 422, "INVALID_TEMP_USER");
        }
    }

    public static buildStagedUser(
        email: string,
        username: string,
        password_hash: string,
        verification_code: string,
    ): StagedUser{

        StagedUser.validateEmail(email);
        StagedUser.validateUsername(username);
        StagedUser.validateVerificationCode(verification_code);

        const nowObj = new Date();

        const created_at = nowObj.toISOString();

        const expires_at = new Date(nowObj.getTime() + 10 * 60 * 1000).toISOString(); //10 minutos no futuro

        return new StagedUser({
            id: crypto.randomUUID(),
            email,
            username,
            password_hash,
            verification_code,
            created_at: created_at,
            expires_at: expires_at 
        })
    }
    //public static restore(props: UserProps): User{
    //        User.validateUsername(props.username);
    //        return new User(props);
    //    }

    public static restore(props: StagedUserProps): StagedUser{

        StagedUser.validateEmail(props.email);
        StagedUser.validateUsername(props.username);
        StagedUser.validateVerificationCode(props.verification_code);

        return new StagedUser(props);
        
    }

    get id() {return this.props.id}
    get email() {return this.props.email}
    get username() {return this.props.username}
    get verificationCode() {return this.props.verification_code}
    get createdAt() {return this.props.created_at}
    get expiresAt() {return this.props.expires_at}
    get password_hash() {return this.props.password_hash}

}