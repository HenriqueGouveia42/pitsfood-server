// src/modules/sale/services/CloseSaleService.ts
import type { SaleProduct } from "@prisma/client";
import { PubSubChannels } from "../../../shared/constants/pub-sub-channels.js";
import { redisPublisher } from "../../../shared/infra/redis/index.js";
import type { IUnitOfWork, ITransactionRepositories } from "../../../shared/infra/uow/interface/uow.interface.js";
import type { Sale, SaleProductProp } from "../entities/sale.js";

type CloseSaleRepos = Pick<ITransactionRepositories, "saleRepository" | "billRepository" | "productRepository">;

export interface ICloseSaleRequest {
    sale: Sale;
    billCodesToClose: string[];
}

/*
    1. Otimizar (Pré-processar) - Agrupar as quantidades totais por produto

    1.1. Já que um produto salvo com o atributo "track_stock" como false possui sempre o atributo "quantity" igual a zero, podemos iterar tranquilamente
        sobre todos os itens de uma venda, mesmo os que não possuem stock a decrementar

    2. Abre o Túnel Transacional Atômico

        2.1. Persiste a venda (Único INSERT via createMany)

        2.2. Fecha as Comandas Lógicas (Único UPDATE via IN)

        2.3. Baixa de Estoque em Lote (Único UPDATE via RAW SQL CASE)
    
    3. Faz o publish para atualizar na tela em tempo real

*/

export class CloseSaleService {
    
    constructor(private uow: IUnitOfWork) {}

    async execute({ sale, billCodesToClose }: ICloseSaleRequest): Promise<void> {
        
        // 1. 
        const stockToDecrement: Map<string, number> = new Map<string, number>();

        // 1.1.
        for (const item of sale.items) {

            const currentQuantity: number = stockToDecrement.get(item.product_id) || 0;

            stockToDecrement.set(item.product_id, currentQuantity + item.quantity);

        }

        // 2. 
        await this.uow.transaction<void, CloseSaleRepos>(async (repositories) => {
            
            // 2.1.
            await repositories.saleRepository.makeSale(sale);

            const now: Date = new Date();

            // 2.2.
            if (billCodesToClose.length > 0) {
                await repositories.billRepository.closeBills(
                    sale.store_id, 
                    billCodesToClose,
                    now
                );
            }

            // 2.3.
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