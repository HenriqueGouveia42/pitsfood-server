import { validCNPJ } from "../../../shared/validators/valid.cnpj.js";
import { DomainError } from "../../../shared/errors/DomainError.js";

export enum SubscriptionPlan {
    NONE = "NONE",
    BASIC = "BASIC",
    EXTENDED = "EXTENDED",
    PREMIUM = "PREMIUM",
    PERSONALIZED = "PERSONALIZED"
}

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
    readonly owner_id: string;
    readonly affiliate_id: string | null;
    readonly created_at: string;
    readonly updated_at: string;
    readonly plan: SubscriptionPlan;
    readonly subscription_status: SubscriptionStatus;
    readonly store_icon_url: string | null;
    readonly subscription_expires_at: string | null;
    readonly billing_day: number | null;
}

export type BuildStoreProps = {
    readonly store_id: string,
    readonly now_date: string,
    readonly name: string,
    readonly active: boolean,
    readonly cnpj: string | null,
    readonly owner_id: string,
    readonly store_icon_url: string | null,
    readonly affiliate_id: string | null
}

export class Store {

    // Adicionamos a validação de invariantes de estado diretamente no construtor.
    // Assim, o buildStore, o restore e qualquer setter passarão por essa peneira.
    private constructor(private readonly props: StoreProps) {
        this.validateSubscriptionState();
    }

    public get getProps(): StoreProps {
        return this.props;
    }

    private validateSubscriptionState(): void {
        if (
            this.props.plan !== SubscriptionPlan.NONE &&
            this.props.subscription_status === SubscriptionStatus.NONE
        ) {
            throw new DomainError("Se uma loja já contratou um plano, deve existir um status para esse plano contratado", "INVALID_SUBSCRIPTION_STATE");
        }

        if (
            this.props.plan === SubscriptionPlan.NONE &&
            this.props.subscription_status !== SubscriptionStatus.NONE
        ) {
            throw new DomainError("Se uma loja ainda nao contratou nenhum plano, nao pode ter nenhum status de plano", "INVALID_SUBSCRIPTION_STATE");
        }
    }

    private static validateNameLength(name: string): void {
        const trimmedName = name.trim();
        if (trimmedName.length < 3) {
            throw new DomainError("O nome da loja deve ter no mínimo 3 caracteres.", "INVALID_NAME_LENGTH");
        }
        if (trimmedName.length > 100) {
            throw new DomainError("O nome da loja deve ter no máximo 100 caracteres.", "INVALID_NAME_LENGTH");
        }
    }

    private static formatNameTitleCase(name: string): string {
        return name
            .trim()
            .toLowerCase()
            .split(' ')
            .filter(word => word.length > 0) // CORREÇÃO: Remove espaços duplos acidentais antes de fazer o map
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    private static validateIconUrl(url: string | null): void {
        if (!url) return;

        try {
            const parsedUrl = new URL(url);
            
            // forçar HTTPS para segurança
            if (parsedUrl.protocol !== "https:") {
                throw new DomainError("A URL da imagem deve ser segura (HTTPS).", "INVALID_ICON_PROTOCOL");
            }
        } catch (error) {
            if (error instanceof DomainError) throw error;
            throw new DomainError("A URL do ícone fornecida é inválida.", "INVALID_ICON_URL");
        }
    }

    private static validateCnpj(cnpj: string | null): void {
        if (cnpj !== null) {
            const isCNPJValid: boolean = validCNPJ(cnpj);
            if (!isCNPJValid) throw new DomainError("CNPJ invalido", "INVALID_CNPJ");
        }
    }


    public static buildStore(build_props: BuildStoreProps): Store {
        
        Store.validateNameLength(build_props.name);
        const formattedName = Store.formatNameTitleCase(build_props.name);
        
        Store.validateIconUrl(build_props.store_icon_url);
        Store.validateCnpj(build_props.cnpj);

        return new Store({
            store_id: build_props.store_id,
            name: formattedName,
            cnpj: build_props.cnpj,
            owner_id: build_props.owner_id,
            active: build_props.active,
            created_at: build_props.now_date,
            updated_at: build_props.now_date,
            plan: SubscriptionPlan.NONE,
            subscription_status: SubscriptionStatus.NONE,
            store_icon_url: build_props.store_icon_url ? build_props.store_icon_url : null,
            subscription_expires_at: null,
            billing_day: null,
            affiliate_id: build_props.affiliate_id ? build_props.affiliate_id : null
        });
    }

    public static restore(props: StoreProps): Store {
        return new Store(props);
    }


    public rename(newName: string): Store {
        Store.validateNameLength(newName);
        const formattedName = Store.formatNameTitleCase(newName);

        return new Store({ 
            ...this.props, 
            name: formattedName,
            updated_at: new Date().toISOString()
        });
    }

    public updateIcon(newIconUrl: string | null): Store {
        Store.validateIconUrl(newIconUrl);

        return new Store({
            ...this.props,
            store_icon_url: newIconUrl,
            updated_at: new Date().toISOString()
        });
    }

    public activatePlan(plan: SubscriptionPlan, expires_at: Date): Store {
        if (plan === SubscriptionPlan.NONE) {
            throw new DomainError("Não é possivel ativar uma loja com o plano 'None'", "INVALID_ACTIVATION_PLAN");
        }

        let currentBillingDay: number | null = this.props.billing_day;
        const previousStatus: SubscriptionStatus = this.props.subscription_status;

        // Casos em que atualiza o dia do faturamento (reset de ciclo)
        if (
            !currentBillingDay ||
            previousStatus === SubscriptionStatus.PAST_DUE ||
            previousStatus === SubscriptionStatus.CANCELED
        ) {
            const today: number = new Date().getDate();
            // Proteção contra o bug de fevereiro
            currentBillingDay = today > 28 ? 28 : today; 
        }

        return new Store({
            ...this.props,
            plan: plan,
            subscription_status: SubscriptionStatus.ACTIVE,
            subscription_expires_at: expires_at.toISOString(),
            billing_day: currentBillingDay,
            updated_at: new Date().toISOString()
        });
    }

    public markAsPastDue(): Store {
        return new Store({
            ...this.props,
            subscription_status: SubscriptionStatus.PAST_DUE,
            updated_at: new Date().toISOString()
        });
    }


    get id() { return this.props.store_id; }
    get name() { return this.props.name; }
    get cnpj() { return this.props.cnpj; }
    get active() { return this.props.active; }
    get createdAt() { return this.props.created_at; }
    get updatedAt() { return this.props.updated_at; }
    get ownerId() { return this.props.owner_id; }
    get plan() { return this.props.plan; }
    get subscription_status() { return this.props.subscription_status; }
    get store_icon_url() { return this.props.store_icon_url; }
    get subscription_expires_at() { return this.props.subscription_expires_at; }
    get billing_day() { return this.props.billing_day; }
    get affiliate_id() { return this.props.affiliate_id; }
}