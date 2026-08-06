import type { IProductRepository } from "../../../product/repositories/interfaces/product.repository.interface.js";
import { Decimal } from "decimal.js"
import { PaymentMethod, type SalePaymentProp, type SaleProductProp } from "../../entities/sale.js";
import { Sale } from "../../entities/sale.js";
import type { IBillRepository } from "../../../bill/repositories/interfaces/bill.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import crypto from "crypto"
import type { Bill } from "../../../bill/entities/bill.js";
import type { Product } from "../../../product/entities/product.js";
import { User } from "../../../user/entities/user.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";

// Importamos o novo Service
import type { CloseSaleService } from "../../services/CloseSaleService.js";

type PaymentDTO = {
    amount: number | string | Decimal,
    method: PaymentMethod
}

interface IRequest {
    store_id: string,
    user_id: string,
    bill_physical_codes: string[],
    products_gtin_codes: string[],
    payments: PaymentDTO[]
}

/*  1. Validar usuário
    2. Validar a existência de pelo menos um produto avulso ou uma comanda
    3. Validar a existencia de pelo menos uma forma de pagamento
    4. Inicializar um array vazio de objetos que reprensetam um PRODUTO em uma VENDA
    5. Garantir que não existam codigos de comanda física repetidos no array através do uso de SET
    6. Processar comandas, se existirem
        6.1. Buscar no banco de dados todas as comandas que correspondem ao 'store_id', 'bill_code_gtin' e 'status', em uma única query
            6.2. Verificar a integridade do estado das comandas no banco de dados. A quantidade de comandas abertas deve ser igual ao tamanho do array enviado para esse usecase 
            6.3 Iterar sobre as entidades "Bill" retornadas
                6.4. Para cada entidade "Bill", deverá haver um único "Map", onde uma chave única - que representa um produto específico adicionado - mapeia
                para um objeto do tipo

                    {
                        SaleProductProp
                        quantity                    
                    }

                    Para montar um objeto desse tipo para cada entidade "Bill", devemos iterar pelo array "items" de cada entidade "Bill"

                    Lembrando que uma entidade Bill é do tipo
                    
                    ...
                        export type BillProps = {
                            readonly bill_id: string; //representa um uso específico da comanda física
                            readonly bill_code_gtin: string; //representa uma comanda física. Comanda "1025", por exemplo, que será utilizada por diversos clientes
                            readonly status: billStates;
                            readonly store_id: string;
                            readonly created_at: string;
                            readonly updated_at: string;
                            readonly items: BillItemProps[]; //relacionamento com bill_items
                        },
                    ...
                    
                    E o tipo 'BillItemProps' é do tipo

                    ...
                        export type BillItemProps = {
                            readonly bill_item_id:  string; //representa uma adição específica em uma comanda específica
                            readonly product_name: string,
                            readonly price_at_addition: Decimal;
                            readonly bill_id: string, //de qual comanda veio
                            readonly store_id: string
                        
                            readonly created_at: string,
                            readonly updated_at: string,
                        
                            readonly product_id: string; //qual produto
                            readonly user_id: string; //quem adicionou
                            readonly product_gtin_code: string
                        
                        }
                    ...

                    6.4.1. Durante cada item iterado do array 'items' da entidade 'BillProps', montamos uma chave 
                    chamada 'groupKey', que é montada dependendo de 'product_id', 'price_at_addition' e 'product_name' de cada item do array 'items' de uma entidade "Bill".
                    É necessário depender dessas duas propriedades pois um produto pode ter seu preço atualizado, ou seja, dois itens com o mesmo 'product_id' mas
                    'price_at_addition' diferentes devem formar um novo par key-value dentro do Map. Caso contrário, a soma final seria não corresponderia ao valor real total dos itens
                    
                    6.4.2. Se 'groupKey' já existe, quer dizer que um produto com o mesmo 'product_id' e 'price_at_addition' já apareceu ao menos uma vez, ou seja, basta
                    incrementarmos o contador 'quantity' do objeto 

                        {
                            SaleProductProp
                            quantity                    
                        }
                    
                    do 'value' dessa 'groupKey' encontrada

                    6.4.3. Se 'groupKey' ainda não existe, devemos criar o par key-value no map

                        Map<string, SaleProductProp> = new Map<string, SaleProductProp>();
                    
                        Com quantity comecando com o valor 1
                
                6.5. Após interar sobre todos os itens de uma comanda, "empurra" todos os values criados a partir dessa comanda específica
                para o array

                    const saleProducts: SaleProductProp[] = [];

                pois agora , uma vez que já percorri todos os itens de uma mesma comanda, já consigo ter um array de objetos que represetam itens de uma venda
                
                
    
    7. Processar produtos avulsos, se existirem - A ideia é a mesma do processamento das comandas - ir transformando cada
    produto enviado - dessa vez na forma de produtos avulsos - em mais um item para o array

        const saleProducts: SaleProductProp[] = [];
    
        7.1. Garantir que não existem 'gtin_code''s duplicados
    
        7.2. Buscar no banco de dados todos os produtos que correspondem a 'gtin_codes' e 'store_id', em uma única query

        7.3. Verificar a integridade do estado dos produtos no banco de dados. A quantidade de produtos retornados pelo banco de dados deve ser igual ao tamanho do array enviado para esse usecase 

        7.4. Iterar sobre todos os itens de 'uniqueGtins', e verificar, item a item, se há correspondência e corretude em relação
        a lista de produtos retornada do banco de dados

            7.4.1. adiciona cada item ao array de 

                const saleProducts: SaleProductProp[] = [];


    8. Processar formas de pagamento

        8.1. Validar pagamentos enviados
        8.2. Iterar sobre os cada pagamento enviado, já validados, e retornar, para cada um, um objeto do tipo

        export type SalePaymentProp = { //representa um pagamento de uma determinada venda  fechada
            readonly sale_payment_id: string,
            readonly amount: Decimal,
            readonly method: PaymentMethod,
            readonly sale_id: string,
        }
    
    9. Contruir o objeto do tipo "Sale"

    10. Service que usa o padrao 'uow' garantir a ATOMICIDADE de uma transacao no banco de dados - FECHAR as comandas e FAZER a venda
    
*/

export class MakeSaleUseCase {
    constructor(
        private closeSaleService: CloseSaleService, 
        
        private productRepository: IProductRepository,
        private billRepository: IBillRepository,
        private userRepository: IUserRepository
    ) {}

    public async execute({
            store_id,
            user_id,
            bill_physical_codes = [], 
            products_gtin_codes = [],
            payments = []
        }: IRequest): Promise<Sale> {

        // 1.
        const user_closing_sale: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!user_closing_sale) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        
        // 2.
        if (bill_physical_codes.length === 0 && products_gtin_codes.length === 0) 
            throw new AppError("A venda precisa ter pelo menos uma comanda ou um produto avulso.", 400, "EMPTY_SALE");

        // 3.
        if (payments.length === 0) 
            throw new AppError("É necessário informar pelo menos uma forma de pagamento.", 400, "NO_PAYMENT_METHOD");

        const sale_id: string = crypto.randomUUID();

        // 4.
        const saleProducts: SaleProductProp[] = [];

        // 5.
        const uniqueBillCodes = Array.from(new Set(bill_physical_codes));

        // 6.
        if(uniqueBillCodes.length > 0){

            // 6.1.
            const openBills: Bill[] = await this.billRepository.getManyOpenBillsByCodes(uniqueBillCodes, store_id);

            // 6.2.
            if(openBills.length !== uniqueBillCodes.length) {
                const foundCodes = openBills.map(b => b.bill_code);
                const missingCodes = uniqueBillCodes.filter(code => !foundCodes.includes(code));
                throw new AppError(`As seguintes comandas não foram encontradas ou já estão fechadas: ${missingCodes.join(', ')}`, 404, "BILL_NOT_FOUND_OR_CLOSED");
            }

            // 6.3.
            for (const bill of openBills) {

                // 6.4.
                const billItemsMap: Map<string, SaleProductProp> = new Map<string, SaleProductProp>();

                for (const item of bill.items) {

                    // Se o item foi removido/desativado da comanda, ignoramos na cobrança!
                    if(!item.active){
                        continue;
                    }

                    // 6.4.1.
                    const groupKey: string = `${item.product_id}-${item.price_at_addition.toNumber()}-${item.product_name}`;

                    // 6.4.2.
                    if(billItemsMap.has(groupKey)){

                        const existing = billItemsMap.get(groupKey)!;
                        billItemsMap.set(groupKey, { ...existing, quantity: existing.quantity + 1 });

                    } else { // 6.4.3.
                        billItemsMap.set(groupKey, {
                            sale_product_id: crypto.randomUUID(),
                            unit_price_snapshot: item.price_at_addition,
                            product_name_snapshot: item.product_name,
                            product_gtin_snapshot: item.product_gtin_code,
                            store_id,
                            sale_id,
                            product_id: item.product_id,
                            origin_bill_id: bill.bill_id,

                            quantity: 1,
                        })
                    }

                }

                // 6.5.
                saleProducts.push(...Array.from(billItemsMap.values()));
            }
        }

        // 7.
        if (products_gtin_codes.length > 0) {

            const gtinCounts: Record<string, number> = products_gtin_codes.reduce((acc, gtin) => {
                acc[gtin] = (acc[gtin] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            // 7.1.
            const uniqueGtins: string[] = Object.keys(gtinCounts);

            // 7.2.
            const dbProducts: Product[] = await this.productRepository.findManySavedProductsByGtinCodes(uniqueGtins, store_id);

            // 7.3. 
            if (dbProducts.length !== uniqueGtins.length) {
                
                const foundGtins: string[] = dbProducts.map(p => p.gtin);
                const missingGtins: string[] = uniqueGtins.filter(gtin => !foundGtins.includes(gtin));

                throw new AppError(`Os seguintes produtos não foram encontrados: ${missingGtins.join(', ')}`, 404, "PRODUCT_NOT_FOUND");
            }

            // 7.4.

            for (const gtin of uniqueGtins) {

                const product: Product | undefined = dbProducts.find(p => p.gtin === gtin);
                if (!product) throw new AppError(`Produto avulso com código ${gtin} não encontrado no sistema.`, 404, "PRODUCT_NOT_FOUND");
                if (!product.active) throw new AppError(`O produto ${product.name} está desativado e não pode ser vendido.`, 400, "INACTIVE_PRODUCT");

                // 7.4.1
                saleProducts.push({
                    sale_product_id: crypto.randomUUID(),
                    quantity: gtinCounts[gtin] ?? 1,
                    unit_price_snapshot: new Decimal(product.price),
                    product_name_snapshot: product.name,
                    product_gtin_snapshot: product.gtin,
                    store_id,
                    sale_id,
                    product_id: product.id,
                    origin_bill_id: null
                });
            }
        }

        // 8.
        const salePayments: SalePaymentProp[] = payments.map(p => {

            // 8.1.
            if(!p.amount || Number(p.amount) < 0){
                throw new AppError(`Valor de pagamento inválido no método ${p.method}.`, 400, "INVALID_PAYMENT_AMOUNT");
            }

            if(!Object.values(PaymentMethod).includes(p.method)) {
                throw new AppError(`Método de pagamento inválido: ${p.method}.`, 400, "INVALID_PAYMENT_METHOD");
            }

            let parsedAmount: Decimal;
            try{
                parsedAmount = new Decimal(p.amount);
            } catch (error){
                throw new AppError(`Formato numérico inválido para o valor do pagamento: ${p.amount}`, 400, "MALFORMED_DECIMAL");       
            }

            // 8.2.
            return {
                sale_payment_id: crypto.randomUUID(),
                amount: parsedAmount,
                method: p.method,
                sale_id: sale_id
            }

        });

        const now_string: string = new Date().toISOString();


        // 9.
        const sale: Sale = Sale.buildSale({
            sale_id,
            store_id,
            user_id,
            items: saleProducts,
            payments: salePayments,
            seller_name: user_closing_sale.username,
            seller_role: user_closing_sale.role,
            now_string: now_string
        });

        // 10.
        await this.closeSaleService.execute({
            sale: sale,
            billCodesToClose: uniqueBillCodes
        });

        return sale;
    }
}