import { Bill } from "../../entities/bill.js"
import { Product } from "../../../product/entities/product.js"
import type { IBillRepository } from "../../repositories/bill.repository.interface.js";
import type { IProductRepository } from "../../../product/repositories/product.repository.interface.js"
import type { IUserRepository } from "../../../user/repositories/user.repository.interface.js"

interface IItemRequest {
    product_gtin_code: string;
    quantity: number;
}

interface IRequest {
    bill_code_gtin: string; //codigo fisico do cartao
    user_id: string; //quem está lancando
    items: IItemRequest[];
}

export class BatchAddItemsUseCase {

    //injecao de dependencia
    //o "BatchAddItemsUseCase" pede as interfaces dos repositorios no contrutor
    //quem vai entregar as implementacoes reais (Prisma por exemplo) é o arquivo index.ts (Factory)
    constructor(
       private billRepository: IBillRepository,
       private productRepository: IProductRepository,
       private userRepository: IUserRepository 
    ) {}

    async execute({ bill_code_gtin, user_id, items }: IRequest): Promise<void>{

        //1. validacao de seguraca. o usuario existe?
        const user = await this.userRepository.findSavedUserById(user_id);
        if (!user){
            throw new Error("Usuario não encontrado");
        }

        //2. validacao logica: a lista tem itens?
        if(!items || items.length === 0){
            throw new Error("Lista ausente ou sem itens")
        }

        //3. carregar estado atual da comanda
        let currentBill: Bill | null = await this.billRepository.findOpenBillByGtinCode(bill_code_gtin);

        //pode ser que o usuario tenha passado um "bill_code_gtin" errado ou entao realmente nao existe uma comanda aberta, ou seja, essa comanda
        //fisica ja foi fechada
        if (!currentBill){

            const isValidPhysicalBillCard: boolean = await this.billRepository.billWithThisGtinCodeExists(bill_code_gtin);

            if (!isValidPhysicalBillCard){
                throw new Error("Comanda com esse gtin-code nao existe!")
            }

            currentBill = Bill.buildBill(bill_code_gtin);

            await this.billRepository.createOpenBill(currentBill)

        }

        //extrai apenas os GTINs para busca
        const requestedGtins: string[] = items.map(i => i.product_gtin_code);
        const productsFound: Product[] = await this.productRepository.findManySavedProductsByGtinCodes(requestedGtins);

        //4. verificar se a quantidade de produtos que vieram do banco de dados é a mesma do que foi enviado
        //pelo vendedor
        const requestedGtinsUnique = Array.from(new Set(requestedGtins));

        if (productsFound.length != requestedGtinsUnique.length){
            const foundGtins = productsFound.map(p => p.gtin);
            const missingGtins = requestedGtinsUnique.filter(gtin => !foundGtins.includes(gtin));
            throw new Error(`Produtos não encontrados ou inativos: ${missingGtins.join(', ')}`);
        }

        for (const itemRequest of items){

            const product = productsFound.find(p => p.gtin === itemRequest.product_gtin_code);

            if (!product){
                throw new Error(`Erro de consistência: O produto ${itemRequest.product_gtin_code} sumiu da memoria`)
            }

            currentBill = currentBill.addProduct(
                product,
                itemRequest.quantity,
                user.id
            )
        }

        await this.billRepository.updateSavedBill(currentBill); 

    }
}