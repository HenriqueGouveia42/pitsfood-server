import { AppError } from "../../../../../shared/errors/AppError.js"
import type { IStoreRepository } from "../../../../store/repositories/interfaces/store.repository.interface.js"
import type { IUserRepository } from "../../../../user/repositories/interfaces/user.repository.interface.js"
import type { Bill } from "../../../entities/bill.js"
import type { IBillRepository } from "../../../repositories/interfaces/bill.repository.interface.js"
import { User } from "../../../../user/entities/user.js"
import type { Store } from "../../../../store/entities/store.js"
import { PubSubChannels } from "../../../../../shared/constants/pub-sub-channels.js"
import { redisPublisher } from "../../../../../shared/infra/redis/index.js"

export type inputDTO = {
    bill_id: string,
    bill_item_id: string,
    store_id: string,
    user_id: string,
}

/*
    Usecase para reativar um item que foi removido (desativado) de uma comanda específica
*/

export class ReactivateItemUseCase {
    constructor(
        private billRepository: IBillRepository,
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository
    ){}

    public async execute(input: inputDTO) {

        const now: Date = new Date();

        const user: User | null = await this.userRepository.findSavedUserById(input.user_id);
        if(!user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");

        const store: Store | null = await this.storeRepository.findSavedStoreById(input.store_id);
        if(!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");

        if(!user.storeId && (store.ownerId !== user.id)) throw new AppError("Inconsistencia usuario-loja", 403, "STORE_MISMATCH"); 
        if(user.storeId && (user.storeId !== store.id)) throw new AppError("Inconsistencia usuario-loja", 403, "STORE_MISMATCH");

        const bill: Bill | null = await this.billRepository.findBillByBillId(input.bill_id);
        if(!bill) throw new AppError("Comanda nao encontrada", 404, "BILL_NOT_FOUND");

        const updated_bill: Bill = bill.reactivateProduct(input.bill_item_id, now.toISOString());

        await this.billRepository.reactivateItem(
            input.store_id,
            input.bill_id,
            input.bill_item_id,
            now
        );

        const channel: string = PubSubChannels.Store.BILL_UPDATES(store.id);

        const payload = JSON.stringify({
            event: "BILL_UPDATED",
            bill_code: updated_bill.bill_code
        });

        await redisPublisher.publish(channel, payload);
    }
}