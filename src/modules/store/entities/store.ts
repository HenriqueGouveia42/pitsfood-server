import { validCNPJ } from "../../../shared/validators/valid.cnpj.js";
import { AppError } from "../../../shared/errors/AppError.js";

/**
 * enum SubscriptionPlan {
  NONE //loja que acabou de ser criada
  BASIC
  EXTENDED
  PREMIUM
}
*/
export enum SubscriptionPlan {
    NONE = "NONE",
    BASIC = "BASIC",
    EXTENDED = "EXTENDED",
    PREMIUM = "PREMIUM"
}

/*
enum SubscriptionStatus {
  NONE//loja que acabou de ser criada
  ACTIVE
  PAST_DUE
  CANCELED
*/

export enum SubscriptionStatus {
    NONE = "NONE",
    ACTIVE = "ACTIVE",
    PAST_DUE = "PAST_DUE",
    CANCELED = "CANCELED"
}

export type StoreProps = {
    readonly store_id: string;
    readonly name: string;
    readonly cnpj: string | null;
    readonly active: boolean;
    readonly owner_id: string,
    readonly created_at: string;
    readonly updated_at: string;
    readonly plan: SubscriptionPlan
    readonly subscription_status: SubscriptionStatus
    readonly store_icon_url: string | null
}

export class Store{

    private constructor(private props: StoreProps){}

    public get getProps(): StoreProps{
        return this.props
    }

    private static validateNameLength(name: string): void {
        const trimmedName = name.trim();
        if (trimmedName.length < 3) {
            throw new AppError("O nome da loja deve ter no mínimo 3 caracteres.", 400, "INVALID_NAME_LENGTH");
        }
        if (trimmedName.length > 100) {
            throw new AppError("O nome da loja deve ter no máximo 100 caracteres.", 400, "INVALID_NAME_LENGTH");
        }
    }

    private static formatNameTitleCase(name: string): string {
        return name
            .trim()
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    private static validateIconUrl(url: string | null): void {
        if (!url) return;

        try {

            const parsedUrl = new URL(url);
            
            //forçar HTTPS para segurança
            if (parsedUrl.protocol !== "https:") throw new AppError("A URL da imagem deve ser segura (HTTPS).", 400, "INVALID_ICON_PROTOCOL");
        
        } catch (error) {

            if (error instanceof AppError) throw error;
            throw new AppError("A URL do ícone fornecida é inválida.", 400, "INVALID_ICON_URL");
        }
    }

    public static buildStore(name: string, active: boolean, cnpj: string | null, owner_id: string, store_icon_url: string | null): Store{

        Store.validateNameLength(name);
        const formattedName = Store.formatNameTitleCase(name);
        Store.validateIconUrl(store_icon_url);

        if(cnpj !== null){
            
            const isCNPJValid: boolean = validCNPJ(cnpj);

            if (!isCNPJValid){
                throw new AppError("CNPJ invalido", 422, "INVALID_CNPJ")
            }
        }
        

        const now = new Date().toISOString();
        
        const store: Store = new Store({
            store_id: crypto.randomUUID().toString(),
            name: formattedName, // Passamos o nome formatado aqui
            cnpj,
            owner_id,
            active,
            created_at: now,
            updated_at: now,
            plan: SubscriptionPlan.NONE,
            subscription_status: SubscriptionStatus.NONE,
            store_icon_url: store_icon_url ? store_icon_url : null
        })

        if (
            (store.plan !== SubscriptionPlan.NONE) &&
            (store.subscription_status == SubscriptionStatus.NONE)
        ){
            throw new AppError("Se uma loja já contratou um plano, deve existir um status para esse plano contratado")
        }

        if (
            (store.plan === SubscriptionPlan.NONE) &&
            (store.subscription_status !== SubscriptionStatus.NONE)
        ){
            throw new AppError("Se uma loja ainda nao contratou nenhum plano, nao pode ter nenhum status de plano")
        }

        return store
    }

    public static restore(props: StoreProps): Store{
        return new Store(props);
    }

    public rename(newName: string): Store {
        return new Store({ ...this.props, name: newName })
    }

    public updateIcon(newIconUrl: string | null): Store {

        Store.validateIconUrl(newIconUrl);

        return new Store({
            ...this.props,
            store_icon_url: newIconUrl,
            updated_at: new Date().toISOString()
        });
    }

    get id() {return this.props.store_id}
    get name() {return this.props.name}
    get cnpj() {return this.props.cnpj}
    get active() {return this.props.active}
    get createdAt() {return this.props.created_at}
    get updatedAt() {return this.props.updated_at}
    get ownerId() {return this.props.owner_id}
    get plan() {return this.props.plan}
    get subscription_status() {return this.props.subscription_status}
    get store_icon_url() {return this.props.store_icon_url}

}