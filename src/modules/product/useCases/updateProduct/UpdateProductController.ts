import type { Request, Response } from "express"
import { UpdateProductUseCase } from "./UpdateProductUseCase.js"
import { AppError } from "../../../../shared/errors/AppError.js"

interface IUpdatedProductController{
    product_id: string,
    name: string | undefined,
    unit_price_in_reais: number | undefined,
    active: boolean | undefined
}

export class UpdateProductController{

    constructor(
        private updatedProductUseCase: UpdateProductUseCase
    ){}

    public async handle(req: Request, res: Response): Promise<Response>{
        //public async execute({ product_id, store_id, user_id, name, unit_price_in_reais, active }: UpdateProductUseCaseRequest){  
      
        const { name, unit_price_in_reais, active }: IUpdatedProductController = req.body;
        const { product_id } = req.params;
        const user_id: string = req.user.id;
        const store_id: string = req.user.store_id;

        await this.updatedProductUseCase.execute({
            product_id: product_id as string,
            store_id,
            user_id,
            name,
            unit_price_in_reais,
            active
        })

        return res.status(200).json({message: "Produto atualizado com sucesso"})

        
    }
}