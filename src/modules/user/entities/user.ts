import { AppError } from "../../../shared/errors/AppError.js";

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
    readonly paying_user: boolean
}

export class User {
    //construtor privado para garantir o uso do builder/fábrica
    private constructor(private readonly props: UserProps) {}

    //validacoes
    private static validateUsername(username: string): void {
        if (username.length < 3) throw new AppError("Nome de usuário deve ter pelo menos 3 caracteres", 422, "INVALID_USER");
        if (username.length > 50) throw new AppError("Nome de usuário não pode ultrapassar 50 caracteres", 422, "INVALID_USER");
    }

    private static validatePayingUser(user:User): void{
        if(user.paying_user && user.role != UserRole.GESTOR) throw new AppError("O usuario pago necessariamente é um gestor")
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
        username: string,
        password_hash: string,
        role: UserRole,
        email: string,
        store_id: string | null,
        must_change_password: boolean,
        is_paying_user: boolean
    
    ): User {

        User.validateUsername(username);

        const finalName: string = this.formatUsername(username);

        const now = new Date().toISOString();

        const user:User = new User({
            user_id: crypto.randomUUID(),
            email,
            username: finalName,
            password_hash,
            created_at: now,
            updated_at: now,
            role,
            active: true,
            store_id: store_id ? store_id : null,
            must_change_password,
            paying_user: is_paying_user //o usuario comum é o que nao paga, ele nao é o
        })

        User.validatePayingUser(user);

        return user;
    }

    public static restore(props: UserProps): User{
        User.validateUsername(props.username);
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

    //setters que retornam novos objetos, mantendo a imutabilidade de um objeto criado
    public withUpdatedData(newUsername:string, newHashedPassword: string, active: boolean): User {

        User.validateUsername(newUsername);

        return new User({
            ...this.props,
            username: newUsername,
            password_hash: newHashedPassword,
            active: active,
            updated_at: new Date().toISOString()
        })
    }

    public setStoreId(store_id: string): User {

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