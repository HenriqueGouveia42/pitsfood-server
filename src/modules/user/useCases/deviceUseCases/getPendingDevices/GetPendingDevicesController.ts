import type { Request, Response } from "express";
import { AppError } from "../../../../../shared/errors/AppError.js";
import type { GetPendingDevicesUseCase } from "./GetPendingDevicesUseCase.js";

export class GetPendingDevicesController {
    constructor(private getPendingDevicesUseCase: GetPendingDevicesUseCase) {}

    handle = async (req: Request, res: Response): Promise<Response> => {
        const store_id = req.user?.store_id;

        if (!store_id) {
            throw new AppError("Contexto de loja obrigatório", 403, "STORE_CONTEXT_REQUIRED");
        }

        const pendingDevices = await this.getPendingDevicesUseCase.execute(store_id);

        return res.status(200).json(pendingDevices);
    }
}