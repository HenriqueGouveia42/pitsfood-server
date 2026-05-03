import { DomainError } from "../../../shared/errors/DomainError.js";
import { validCNPJ } from "../../../shared/validators/valid.cnpj.js";
import { validateCPF } from "../../../shared/validators/valid.cpf.js";

export enum UserRole {
    GESTOR = "GESTOR",
    CAIXA = "CAIXA",
    VENDEDOR = "VENDEDOR"
}

export type UserProps = {
    readonly user_id: string;
    readonly store_id: string | null,
    readonly email: string,
    readonly username: string;
    readonly password_hash: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly role: UserRole;
    readonly active: boolean;
    readonly must_change_password: boolean,
    readonly paying_user: boolean,

    readonly cpf_cnpj: string,
    readonly phone: string | null
}

export type BuildUserProps = {
    user_id: string,
    nowDate: string,
    username: string,
    password_hash: string,
    role: UserRole,
    email: string,
    store_id: string | null,
    must_change_password: boolean,
    is_paying_user: boolean,
    cpf_cnpj: string,
    phone: string | null,
}

export class User {
    //construtor privado para garantir o uso do builder/fábrica
    private constructor(private readonly props: UserProps) {}

    //validacoes
    private static validateUsername(username: string): void {
        if (username.length < 3) throw new DomainError("Nome de usuário deve ter pelo menos 3 caracteres");
        if (username.length > 50) throw new DomainError("Nome de usuário não pode ultrapassar 50 caracteres")
    }

    private static validatePayingUser(user:User): void{
        if(user.paying_user && user.role != UserRole.GESTOR) throw new DomainError("O usuario pago necessariamente é um gestor")
    }

    private static formatUsername(username: string): string {
        return username
            .trim()
            .toLowerCase()
            .split(' ')
            .filter(word => word.length > 0) //Remove espaços duplos acidentais
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    //fabric apara criação de novos usuários (cadastrar novo usuario)
    public static buildUser(
        props: BuildUserProps
    ): User {

        const finalName: string = this.formatUsername(props.username);

        User.validateUsername(finalName);

        //ou ele enviou um CPF ou ele enviou um CNPJ

        const is_valid_cpf: boolean = validateCPF(props.cpf_cnpj);
        const is_valid_cnpj: boolean = validCNPJ(props.cpf_cnpj);

        if ((!is_valid_cnpj)&&(!is_valid_cpf)) throw new DomainError("Precisa de um CPF ou CNPJ valido");

        const user:User = new User({
            user_id: props.user_id,
            store_id: props.store_id,
            email: props.email,
            username: finalName,
            password_hash: props.password_hash,
            created_at: props.nowDate,
            updated_at: props.nowDate,
            role: props.role,
            active: true,
            must_change_password: props.must_change_password,
            paying_user: props.is_paying_user,
            cpf_cnpj: props.cpf_cnpj,
            phone: props.phone
        })

        User.validatePayingUser(user);

        return user;
    }

    public static restore(props: UserProps): User{
        return new User(props);
    }

    //getters
    get id() { return this.props.user_id; }
    get username() { return this.props.username; }
    get passwordHash() { return this.props.password_hash; }
    get role() { return this.props.role; }
    get createdAt() { return this.props.created_at; }
    get updatedAt() { return this.props.updated_at; }
    get active() { return this.props.active; }
    get storeId() {return this.props.store_id}
    get email() {return this.props.email}
    get mustChangePassword() {return this.props.must_change_password; }
    get paying_user() {return this.props.paying_user; }
    get cpf_cnpj() {return this.props.cpf_cnpj; }
    get phone() {return this.props.phone; }

    //setters que retornam novos objetos, mantendo a imutabilidade de um objeto criado
    public withUpdatedData(newUsername:string, newHashedPassword: string, active: boolean): User {

        const formattedUsername: string = User.formatUsername(newUsername);

        User.validateUsername(formattedUsername);
        
        return new User({
            ...this.props,
            username: formattedUsername,
            password_hash: newHashedPassword,
            active: active,
            updated_at: new Date().toISOString()
        })
    }

    public setStoreId(store_id: string | null): User {

        return new User({
            ...this.props,
            store_id: store_id
        })

    }

    public setNewPassword(new_password: string): User{
        return new User({
            ...this.props,
            password_hash: new_password
        })
    }

    public setMustChangePasswordToFalse(): User{
        return new User({
            ...this.props,
            must_change_password: false
        })
    }

    public setMustChangePasswordToTrue(): User{
        return new User({
            ...this.props,
            must_change_password: true
        })
    }
}