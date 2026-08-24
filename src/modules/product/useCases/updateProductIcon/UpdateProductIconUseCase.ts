import type { IProductRepository } from "../../repositories/interfaces/product.repository.interface.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import type { IStorageProvider } from "../../../../shared/providers/interfaces/storageProvider/IStorageProvider.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { MIME_TYPE_MAP } from "../../../store/useCases/updateStoreIcon/UpdateStoreIconUseCase.js";
import { User } from "../../../user/entities/user.js";
import type { Product } from "../../entities/product.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { Store } from "../../../store/entities/store.js";
import type { IStoreRepository } from "../../../store/repositories/interfaces/store.repository.interface.js";

interface IRequest {
    product_id: string;
    store_id: string;
    user_id_trying_to_update: string;
    icon_file: {
        buffer: Buffer;
        mimetype: string;
    };
}

export class UpdateProductIconUseCase {
    constructor(
        private productRepository: IProductRepository,
        private userRepository: IUserRepository,
        private storeRepository: IStoreRepository,
        private storageProvider: IStorageProvider,
        private cacheProvider: ICacheProvider
    ) {}
    
    public async execute({ product_id, store_id, user_id_trying_to_update, icon_file }: IRequest): Promise<string> {
        
        const user: User | null = await this.userRepository.findSavedUserById(user_id_trying_to_update);
        if(!user) throw new AppError("Usuário inválido.", 404, "USER_NOT_FOUND");

        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if(!store) throw new AppError("Loja nao encontrada", 404, "STORE_NOT_FOUND");

        // Regra de pertencimento da loja
        if (user.paying_user) {
            if (store.ownerId !== user.id) throw new AppError("Acesso negado à loja.", 403, "STORE_MISMATCH");
        } else {
            if (user.storeId !== store.id) throw new AppError("Acesso negado à loja.", 403, "STORE_MISMATCH");
        }

        // 2. Busca e Validação do Produto
        const product: Product | null = await this.productRepository.findSavedProductById(product_id, store_id);
        if (!product) throw new AppError("Produto não encontrado.", 404, "PRODUCT_NOT_FOUND");

        // 3. Valida mimetype (Whitelist)
        const fileExtension = MIME_TYPE_MAP[icon_file.mimetype];
        if (!fileExtension) {
            throw new AppError("Formato de imagem inválido.", 400, "INVALID_IMAGE_FORMAT");
        }

        // Guarda a referência da URL antiga
        const oldIconUrl: string | null = product.product_icon_url;

        // 4. Define o nome do novo arquivo (Estruturado em pastas por loja para organização no S3)
        const fileName: string = `products/${store_id}/${product.product_icon_url}-${Date.now()}.${fileExtension}`;

        // 5. Salva a nova imagem no Storage PRIMEIRO
        const publicUrl: string = await this.storageProvider.save(
            fileName,
            icon_file.buffer,
            icon_file.mimetype
        );

        // 6. Atualiza o banco com estratégia de compensação (Rollback da imagem NOVA)
        try {
            const updatedProduct: Product = product.withUpdatedProductIconUrl(publicUrl); 
            await this.productRepository.updateSavedProduct(updatedProduct, store_id);
        } catch (dbError) {
            console.error("ERRO REAL NO BANCO/ENTIDADE:", dbError);
            await this.storageProvider.delete(fileName);
            throw new AppError("Falha ao atualizar os dados do produto.", 500, "PRODUCT_UPDATE_FAILED");
        }

        // 7. Deleção segura da imagem antiga (Housekeeping)
        if (oldIconUrl) {
            try {
                const parsedUrl = new URL(oldIconUrl);
                const oldPath = parsedUrl.pathname.substring(1); 
                await this.storageProvider.delete(oldPath);
            } catch (error) {
                console.warn(`[UpdateProductIcon] Falha ao parsear ou deletar URL antiga: ${oldIconUrl}`);
            }
        }

        const cache_key: string = CacheKeys.Product.LIST(store_id);

        await this.cacheProvider.invalidate(cache_key);

        return publicUrl;
    }
}