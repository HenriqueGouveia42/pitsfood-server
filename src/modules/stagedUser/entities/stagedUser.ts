import { DomainError } from "../../../shared/errors/DomainError.js";
import { validCNPJ } from "../../../shared/validators/valid.cnpj.js";
import { validateCPF } from "../../../shared/validators/valid.cpf.js";

export type StagedUserProps = {
    readonly id: string,
    readonly email: string,
    readonly username: string,
    readonly password_hash: string,
    readonly verification_code: string,
    readonly last_verification_code_sent_at: string, 
    readonly created_at: string, 
    readonly updated_at: string, 
    readonly expires_at: string, // Vida do StagedUser
    readonly code_expires_at: string, // Vida do código (ex: 10 min) - VOLTOU! 
    readonly cpf_cnpj: string
    readonly phone: string | null
}

export type BuildStagedUserProps = {
    id: string,
    email: string,
    username: string,
    password_hash: string,
    verification_code: string,
    last_verification_code_sent_at: string,
    created_at: string,
    updated_at: string,
    expires_at: string,
    code_expires_at: string, // Vida do código (ex: 10 min) - VOLTOU! 
    cpf_cnpj: string,
    phone: string | null
}

export class StagedUser{

    private constructor(private readonly props: StagedUserProps){}

    //validacoes
    private static validateUsername(username: string): void {
        if (username.length < 3) throw new DomainError("Nome de usuário temporario deve ter pelo menos 3 caracteres", "INVALID_TEMP_USER");
        if (username.length > 50) throw new DomainError("Nome de usuário temporario não pode ultrapassar 50 caracteres", "INVALID_TEMP_USER");
    }

    private static validateEmail(email: string): void {

        if (!email) throw new DomainError("O email é obrigatório", "INVALID_TEMP_USER");
        if (email.length > 255) throw new DomainError("O email é muito longo", "INVALID_TEMP_USER");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) throw new DomainError("Formato de email inválido", "INVALID_TEMP_USER");
        
    }

    private static validateVerificationCode(code: string): void {

        if (!code) throw new DomainError("O código de verificação é obrigatório", "INVALID_TEMP_USER");
        if (code.length !== 6) throw new DomainError("O código de verificação deve ter exatamente 6 dígitos", "INVALID_TEMP_USER");
        
        const onlyNumbersRegex = /^\d+$/;

        if (!onlyNumbersRegex.test(code)) throw new DomainError("O código de verificação deve conter apenas números", "INVALID_TEMP_USER");
        
    }

    
    public static buildStagedUser(props_build: BuildStagedUserProps): StagedUser{

        StagedUser.validateEmail(props_build.email);
        StagedUser.validateUsername(props_build.username);
        StagedUser.validateVerificationCode(props_build.verification_code);
        
        const is_valid_cnpj: boolean = validCNPJ(props_build.cpf_cnpj);
        const is_valid_cpf: boolean = validateCPF(props_build.cpf_cnpj);

        if ((!is_valid_cnpj)&&(!is_valid_cpf)) throw new DomainError("CPF ou CNPJ invalido", "INVALID_DOCUMENT");

        return new StagedUser(props_build);
    }
   
    public static restore(props: StagedUserProps): StagedUser{
        return new StagedUser(props);
    }

    
    public newVerificationCode(
        new_verification_code: string,
        requestTime: string,
        newCodeExpiresAt: string,
    ): StagedUser{

        // Autoprotecao contra entidade já expirada
        if (new Date(requestTime) > new Date(this.props.expires_at)){
            throw new DomainError("O prazo para cadastro expirou", "REGISTRATION_EXPIRED");
        }

        const lastSent: number = new Date(this.props.last_verification_code_sent_at).getTime()
        const diffInSecond: number = (new Date(requestTime).getTime() - lastSent) / 1000;

        // Autoprotecao de Rate Limit  
        if (diffInSecond < 60) throw new DomainError(`Aguarde mais ${Math.ceil(60 - diffInSecond)} segundos para solicitar outro codigo`, "RATE_LIMIT_EXCEEDED");

        StagedUser.validateVerificationCode(new_verification_code);

        return new StagedUser({
            ...this.props,
            verification_code: new_verification_code,
            last_verification_code_sent_at: requestTime,
            updated_at: requestTime,
            code_expires_at: newCodeExpiresAt
        })
    }

    get id() {return this.props.id}
    get email() {return this.props.email}
    get username() {return this.props.username}
    get password_hash() {return this.props.password_hash}
    get verificationCode() {return this.props.verification_code}
    get lastVerificationCodeSentAt() {return this.props.last_verification_code_sent_at}
    get createdAt() {return this.props.created_at}
    get updatedAt() {return this.props.updated_at}
    get expiresAt() {return this.props.expires_at}
    get codeExpiresAt() {return this.props.code_expires_at}
    get cpf_cnpj() {return this.props.cpf_cnpj}
    get phone() {return this.props.phone}

}