import type { Request, Response } from "express";
import { UnauthorizeDeviceUseCase } from "./UnauthorizeDeviceUseCase.js";

import type { inputDTO as useCaseInputDTO } from "../confirmDevice/ConfirmDeviceUseCase.js";
import { AppError } from "../../../../../shared/errors/AppError.js";


export class UnauthorizeDeviceController {

    constructor(
        private unauthorizeDeviceUseCase: UnauthorizeDeviceUseCase
    ){}

    handle = async(req: Request, res: Response): Promise<Response> => {

        const store_id: string | null | undefined = req.user?.store_id
        const user_id_trying_unauthorize_device = req.user?.id

        if(!store_id) throw new AppError("'store_id' ausente");
        if(!user_id_trying_unauthorize_device) throw new AppError("'id' de usuario ausente");

        const { user_id_target, device_id } = req.params;

        if(!user_id_target || !device_id) throw new AppError("id do usuario alvo ou id do dispositivo ausente");

        await this.unauthorizeDeviceUseCase.execute({
            user_id_trying_unauthorize_device: user_id_trying_unauthorize_device,
            user_id_target: user_id_target,
            device_id: device_id,
            store_id: store_id
        })

        return res.status(200).json({message: "Dispositivo desautorizado com sucesso"});

    }

}
