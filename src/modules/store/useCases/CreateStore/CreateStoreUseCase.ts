import type { IStoreRepository } from "../../repositories/store.repository.interface.js";
import { Store } from "../../entities/store.js";
import type { User } from "../../../user/entities/user.js";
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { PhysicalBill } from "../../../bill/entities/physicalBIllCard.js";
import type { SubscriptionPlan } from "../../../../generated/prisma/enums.js";

interface ICreateStoreUseCase{
    store_name: string,
    cnpj: string | null,
    active: boolean,
    owner_id: string,
    referral_code?: string | null,
    plan?: SubscriptionPlan //se nao vier, assumimos "BASIC"
}

export class CreateStoreUseCase {

    constructor(
        private storeRepository: IStoreRepository,
        private userRepository: IUserRepository,
        //private affiliateRepository:
    ){}

    public async execute( { store_name, cnpj, active=true, owner_id }: ICreateStoreUseCase  ): Promise<Store> {

        const user_trying_to_create_store: User | null = await this.userRepository.findSavedUserById(owner_id);

        //REGRA ONDE UM USER SO PODE TER UMA UNICA LOJA
        if (user_trying_to_create_store?.storeId != null){
            throw new AppError("Esse usuario ja tem uma loja", 403, "ALREADY_HAS_STORE")
        }

        //criar instancia da loja
        const store: Store = Store.buildStore(store_name, active, cnpj, owner_id);

        //criar as comandas físicas - 40 comandas
        const PHYSICAL_BILLS_QUANTITY: number = 40
        let fourDigitValues: string[] = [];

        while(fourDigitValues.length < PHYSICAL_BILLS_QUANTITY){

            const randomNum: number = Math.floor(Math.random() * 10000);

            const generatedValue: string = randomNum.toString().padStart(4, '0');

            if(!fourDigitValues.includes(generatedValue)){
                fourDigitValues.push(generatedValue);
            }
        }

        const physical_bills: PhysicalBill[] = [];

        for (const fourDigitValue of fourDigitValues){

            const generatedPhysicalBill: PhysicalBill = PhysicalBill.buildPhysicalBill(fourDigitValue, store.id);
            physical_bills.push(generatedPhysicalBill)
        }

        //aqui ja temos uma intancia de loja e as comandas fisicas criadas.


        await this.storeRepository.saveStoreAndCreatePhysicalBills(store, physical_bills);

        return store;

    }
}