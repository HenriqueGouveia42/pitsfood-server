import { MIME_TYPE_MAP } from "../../../store/useCases/updateStoreIcon/UpdateStoreIconUseCase.js"

interface inputDTO{
    product_id: string,
    store_id: string,
    user_id_trying_to_update: string,
    icon_file: {
        buffer: Buffer;
        mimetype: string
    }
}

export class UpdateProductUseCase{
    constructor(){}
    
    public async execute(){

    }
}