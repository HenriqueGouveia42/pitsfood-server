import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IStorageProvider } from "../../../../shared/providers/StorageProvider/models/IStorageProvider.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { Store } from "../../entities/store.js";
import type { ICacheProvider } from "../../../../shared/providers/CacheProvider/models/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";

interface IRequest {
    store_id: string;
    icon_file: {
        buffer: Buffer;
        mimetype: string;
    };
}

// Mapa de segurança para garantir apenas extensões válidas
const MIME_TYPE_MAP: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp"
};

export class UpdateStoreIconUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private storageProvider: IStorageProvider,
        private cacheProvider: ICacheProvider
    ) {}

    async execute({ store_id, icon_file }: IRequest): Promise<string> {
        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja não encontrada.", 404, "STORE_NOT_FOUND");

        // 1. Valida mimetype e define a extensão de forma segura
        const fileExtension = MIME_TYPE_MAP[icon_file.mimetype];
        if (!fileExtension) {
            throw new AppError("Formato de imagem inválido.", 400, "INVALID_IMAGE_FORMAT");
        }

        // Se já tiver ícone, deletar usando parser de URL seguro
        if (store.store_icon_url) {
            try {
                const parsedUrl = new URL(store.store_icon_url);
                // remove a barra inicial do pathname. Ex: "/logos/loja.png" -> "logos/loja.png"
                const oldPath = parsedUrl.pathname.substring(1); 
                await this.storageProvider.delete(oldPath);
            } catch (error) {
                console.warn(`[UpdateStoreIcon] Falha ao parsear ou deletar URL antiga: ${store.store_icon_url}`);
                // Não travamos o fluxo principal se a deleção da velha falhar
            }
        }

        // 2. Define o nome do novo arquivo de forma preditiva
        // Um timestamp é útil no nome se você usar cache de CDN longo (Cloudflare), 
        // para forçar a quebra de cache quando a imagem mudar.
        const fileName = `logos/${store.id}-${Date.now()}.${fileExtension}`;

        // 3. Salva no Storage
        const publicUrl = await this.storageProvider.save(
            fileName,
            icon_file.buffer,
            icon_file.mimetype
        );

        // 4. Atualiza o banco com estratégia de compensação (rollback manual)
        try {
            const updatedStore: Store = store.updateIcon(publicUrl);
            await this.storeRepository.updateSavedStore(updatedStore);
        } catch (dbError) {
            // Se o banco falhar, apagamos a imagem que acabou de subir para evitar lixo no S3
            await this.storageProvider.delete(fileName);
            throw new AppError("Falha ao atualizar os dados da loja.", 500, "STORE_UPDATE_FAILED");
        }

        // 5. Invalidação de Cache
        const cacheKey: string = CacheKeys.Store.SUMMARY(store_id);
        await this.cacheProvider.invalidate(cacheKey);

        return publicUrl;
    }
}