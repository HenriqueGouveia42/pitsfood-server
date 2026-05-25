import type { IUnitOfWork, ITransactionRepositories } from "../../../shared/infra/uow/interface/uow.interface.js";
import type { Sale } from "../entities/sale.js";

// Restringe o UoW apenas aos três repositórios necessários para esta transação
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
            
            // Passo A: Persiste a Venda (Venda, Itens e Pagamentos)
            await repositories.saleRepository.makeSale(sale);

            // Passo B: Fecha as Comandas Lógicas (se houver)
            if (billCodesToClose.length > 0) {
                await repositories.billRepository.closeBills(
                    sale.store_id, 
                    billCodesToClose
                );
            }

            // Passo C: Baixa de Estoque
            const decrementPromises = Array.from(stockToDecrement.entries()).map(([productId, quantitySold]) => {
                return repositories.productRepository.decrementProductStock(
                    sale.store_id,
                    productId,
                    quantitySold
                );
            });

            // Dispara todas as requisições de atualização de estoque de uma só vez
            await Promise.all(decrementPromises);
            
        });
    }
}