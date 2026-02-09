import { Decimal } from 'decimal.js';
import type { IProductRepository } from '../../repositories/product.repository.interface.js';
import type { IUserRepository } from '../../../user/repositories/user.repository.interface.js';
import { User } from '../../../user/entities/user.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import type { Product } from '../../entities/product.js';
import { UserRole } from '../../../../generated/prisma/enums.js';
import type { ICacheProvider } from '../../../../shared/providers/CacheProvider/models/ICacheProvider.js';
// Store entity import removido pois a busca redundante foi removida

interface UpdateProductUseCaseRequest{
    product_id: string,
    store_id: string,
    user_id: string,
    name: string | undefined,
    unit_price_in_reais: number | undefined,
    active: boolean | undefined
}

export class UpdateProductUseCase{
    constructor(
        private productRepository: IProductRepository,
        private userRepository: IUserRepository,
        private cacheProvider: ICacheProvider
    ){}

    public async execute({ product_id, store_id, user_id, name, unit_price_in_reais, active }: UpdateProductUseCaseRequest){
        
        //caso o controller deixe passar algo vazio)
        if (!product_id) throw new AppError("ID do produto é obrigatório", 400, "INVALID_INPUT");

        //validação do Usuário - falhar rapido
        const user_trying_to_update: User | null = await this.userRepository.findSavedUserById(user_id);
        
        if (!user_trying_to_update) {
            throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND");
        }

        if (user_trying_to_update.role !== UserRole.GESTOR) { // Uso de !==
            throw new AppError("Usuario nao é gestor", 403, "USER_BE_GESTOR");
        }

        //fazemos isso AGORA para evitar buscar o produto se o usuário já estiver errado.
        if (user_trying_to_update.storeId !== store_id) {
            throw new AppError("Usuario nao pertence a esta loja", 403, "STORE_MISMATCH");
        }

        //validação do Produto
        //repositório já garante que traz o produto APENAS se ele for da store_id informada.
        const product_to_be_updated: Product | null = await this.productRepository.findSavedProductById(product_id, store_id);
        
        if (!product_to_be_updated) {
            throw new AppError("Produto nao encontrado", 404, "PRODUCT_NOT_FOUND");
        }

        //preparação de dados (Utilizando !== undefined)
        const finalName: string = (name !== undefined) ? name : product_to_be_updated.name;
        
     
        const finalUnitPrice: Decimal = (unit_price_in_reais !== undefined) 
            ? new Decimal(unit_price_in_reais) 
            : product_to_be_updated.price;
            
        const finalActive: boolean = (active !== undefined) ? active : product_to_be_updated.active;
        

        const updated_product: Product = product_to_be_updated.withUpdatedData(
            finalName,
            finalUnitPrice,
            finalActive
        );

        
        await this.productRepository.updateSavedProduct(updated_product, store_id);

        const cacheKey: string = `store-products:${store_id}`

        await this.cacheProvider.invalidate
    }
}