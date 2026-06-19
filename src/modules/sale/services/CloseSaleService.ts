// src/modules/sale/services/CloseSaleService.ts
import { PubSubChannels } from "../../../shared/constants/pub-sub-channels.js";
import { redisPublisher } from "../../../shared/infra/redis/index.js";
import type { IUnitOfWork, ITransactionRepositories } from "../../../shared/infra/uow/interface/uow.interface.js";
import type { Sale } from "../entities/sale.js";

type CloseSaleRepos = Pick<ITransactionRepositories, "saleRepository" | "billRepository" | "productRepository">;

export interface ICloseSaleRequest {
    sale: Sale;
    billCodesToClose: string[];
}

export class CloseSaleService {
    
    constructor(private uow: IUnitOfWork) {}

    async execute({ sale, billCodesToClose }: ICloseSaleRequest): Promise<void> {
        
        // 1. Otimização (Pré-processamento): Agrupa as quantidades totais por produto.
        const stockToDecrement = new Map<string, number>();
        for (const item of sale.items) {
            const currentQuantity = stockToDecrement.get(item.product_id) || 0;
            stockToDecrement.set(item.product_id, currentQuantity + item.quantity);
        }

        // 2. Abre o Túnel Transacional Atômico
        await this.uow.transaction<void, CloseSaleRepos>(async (repositories) => {
            
            // Passo A: Persiste a Venda (Único INSERT via createMany)
            await repositories.saleRepository.makeSale(sale);

            // Passo B: Fecha as Comandas Lógicas (Único UPDATE via IN)
            if (billCodesToClose.length > 0) {
                await repositories.billRepository.closeBills(
                    sale.store_id, 
                    billCodesToClose
                );
            }

            // Passo C: Baixa de Estoque em Lote (Único UPDATE via RAW SQL CASE)
            const decrementsArray = Array.from(stockToDecrement.entries()).map(([product_id, quantity]) => ({
                product_id,
                quantity
            }));

            if (decrementsArray.length > 0) {
                await repositories.productRepository.bulkDecrementProductStock(
                    sale.store_id,
                    decrementsArray
                );
            }
            
        });

        if(billCodesToClose.length > 0){
            const channel: string = PubSubChannels.Store.BILL_UPDATES(sale.store_id);
            const payload = JSON.stringify({
                event: "BILLS_CLOSED",
                bills_codes: billCodesToClose
            });
            await redisPublisher.publish(channel, payload);
        }
    }
}