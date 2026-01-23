import { validCNPJ } from "./valid.cnpj.js";
import { AppError } from "../../../shared/errors/AppError.js";

export type StoreProps = {
    readonly store_id: string;
    readonly name: string;
    readonly cnpj: string | undefined;
    readonly active: boolean;
    readonly owner_id?: string | undefined,
    readonly created_at: string;
    readonly updated_at: string
}

export class Store{

    private constructor(private readonly props: StoreProps){}

    public get getProps(): StoreProps{
        return this.props
    }

    public static buildStore(name: string, active: boolean, cnpj?: string): Store{

        if(cnpj !== undefined){
            
            const isCNPJValid: boolean = validCNPJ(cnpj);

            if (!isCNPJValid){
                throw new AppError("CNPJ invalido", 422, "INVALID_CNPJ")
            }
        }
        

        const now = new Date().toISOString();
        
        const store: Store = new Store({
            store_id: crypto.randomUUID().toString(),
            name,
            cnpj: cnpj,
            owner_id: undefined,
            active,
            created_at: now,
            updated_at: now
        })

        return store
    }

    public static restore(props: StoreProps): Store{
        return new Store(props);
    }

    public setOwner(userId: string): Store{
        return new Store({
            ...this.props,
            owner_id: userId,
            updated_at: new Date().toDateString()
        })
    }

    get id() {return this.props.store_id}
    get name() {return this.props.name}
    get cnpj() {return this.props.cnpj}
    get active() {return this.props.active}
    get createdAt() {return this.props.created_at}
    get updatedAt() {return this.props.updated_at}
    get ownerId() {return this.props.owner_id}

}