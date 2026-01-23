import type { IStoreRepository } from "../../repositories/store.repository.interface.js";
import { Store } from "../../entities/store.js";

interface IRequest{
    name: string,
    active: boolean,
    cnpj?: string,
}

export class CreateNewStoreUseCase{

    constructor(
        private storeRepository: IStoreRepository
    ){}

    public async execute( {name, active, cnpj}: IRequest ): Promise<Store>{

        const store: Store = Store.buildStore(
            name,
            active,
            cnpj
        );
        
        await this.storeRepository.saveStore(store);

        return store

    }
}