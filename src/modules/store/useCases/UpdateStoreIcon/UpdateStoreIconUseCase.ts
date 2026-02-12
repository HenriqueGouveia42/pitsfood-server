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
        originalname: string;
    };
}

export class UpdateStoreIconUseCase {
    constructor(
        private storeRepository: IStoreRepository,
        private storageProvider: IStorageProvider,
        private cacheProvider: ICacheProvider
    ) {}

    async execute({ store_id, icon_file }: IRequest): Promise<string> {
        
        const store = await this.storeRepository.findSavedStoreById(store_id);
        if (!store) throw new AppError("Loja não encontrada.", 404, "STORE_NOT_FOUND")


        //se ja tiver  icone, deletar!
        if (store.store_icon_url) {
            //extrai o "path" da URL antiga. 
            //exemplo: de "https://pub.r2.dev/logos/loja-1.png" para "logos/loja-1.png"
            const oldFile = store.store_icon_url.split("/").pop(); 
            if (oldFile) {
                const oldPath = `logos/${oldFile}`;
                await this.storageProvider.delete(oldPath);
            }
        }

        //nome do novo aruivo de icone da loja
        //id da loja no nome para garantir unicidade e fácil substituição
        const fileExtension = icon_file.mimetype.split("/")[1]; // png, jpeg, etc
        const fileName = `logos/${store.id}.${fileExtension}`;

        const publicUrl = await this.storageProvider.save(
            fileName,
            icon_file.buffer,
            icon_file.mimetype
        );

        const updatedStore: Store = store.updateIcon(publicUrl);

        await this.storeRepository.updateSavedStore(updatedStore);

        const cacheKey: string = CacheKeys.Store.SUMMARY(store_id);

        await this.cacheProvider.invalidate(cacheKey);

        return publicUrl;
    }
}