import type { IStoreRepository } from "../../repositories/interfaces/store.repository.interface.js";
import type { IStorageProvider } from "../../../../shared/providers/interfaces/storageProvider/IStorageProvider.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { Store } from "../../entities/store.js";
import type { ICacheProvider } from "../../../../shared/providers/interfaces/cacheProvider/ICacheProvider.js";
import { CacheKeys } from "../../../../shared/constants/cache-keys.js";
import type { IUserRepository } from "../../../user/repositories/interfaces/user.repository.interface.js";
import { User } from "../../../user/entities/user.js";

interface IRequest {
    store_id: string;
    user_id: string;
    icon_file: {
        buffer: Buffer;
        mimetype: string;
    };
}

// Mapa de segurança para garantir apenas extensões válidas
export const MIME_TYPE_MAP: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp"
};

export class UpdateStoreIconUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private storageProvider: IStorageProvider,
        private cacheProvider: ICacheProvider,
        private userRepository: IUserRepository,

    ) {}

    async execute({ store_id, user_id, icon_file }: IRequest): Promise<string> {
        const store: Store | null = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja não encontrada.", 404, "STORE_NOT_FOUND");

        const user: User | null = await this.userRepository.findSavedUserById(user_id);
        if(!user) throw new AppError("Usuario invalido", 404, "USER_NOT_FOUND");

        if (user.paying_user){

            if(store.ownerId !== user.id) throw new AppError("Loja invalida", 404, "STORE_MISMATCH");

        } else{

            if(store.id !== user.storeId) throw new AppError("Loja invalida", 404, "STORE_MISMATCH");

        }


        // 1. Valida mimetype e define a extensão de forma segura
        const fileExtension = MIME_TYPE_MAP[icon_file.mimetype];
        if (!fileExtension) {
            throw new AppError("Formato de imagem inválido.", 400, "INVALID_IMAGE_FORMAT");
        }

        // Guarda a referência da URL antiga para processamento posterior seguro
        const oldIconUrl = store.store_icon_url;

        // 2. Define o nome do novo arquivo de forma preditiva
        const fileName = `logos/${store.id}-${Date.now()}.${fileExtension}`;

        // 3. Salva a nova imagem no Storage PRIMEIRO
        const publicUrl = await this.storageProvider.save(
            fileName,
            icon_file.buffer,
            icon_file.mimetype
        );

        // 4. Atualiza o banco com estratégia de compensação (rollback da imagem NOVA)
        try {
            const updatedStore: Store = store.updateIcon(publicUrl);
            await this.storeRepository.updateSavedStore(updatedStore);
        } catch (dbError) {
            // Se o banco falhar, apagamos a imagem que acabou de subir para evitar lixo no Storage
            await this.storageProvider.delete(fileName);
            throw new AppError("Falha ao atualizar os dados da loja.", 500, "STORE_UPDATE_FAILED");
        }

        // 5. DELEÇÃO SEGURA DA ANTIGA: Só acontece se o banco salvou a URL nova com sucesso
        if (oldIconUrl) {
            try {
                const parsedUrl = new URL(oldIconUrl);
                // remove a barra inicial do pathname. Ex: "/logos/loja.png" -> "logos/loja.png"
                const oldPath = parsedUrl.pathname.substring(1); 
                await this.storageProvider.delete(oldPath);
            } catch (error) {
                console.warn(`[UpdateStoreIcon] Falha ao parsear ou deletar URL antiga: ${oldIconUrl}`);
                // Não travamos o fluxo principal se a deleção da velha falhar, é apenas "housekeeping"
            }
        }

        // 6. Invalidação de Cache
        const cacheKey: string = CacheKeys.Store.SUMMARY(store_id);
        await this.cacheProvider.invalidate(cacheKey);

        return publicUrl;
    }
}