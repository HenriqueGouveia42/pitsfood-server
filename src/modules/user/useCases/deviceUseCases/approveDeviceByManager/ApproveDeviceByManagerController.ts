import type { Request, Response } from "express";
import { AppError } from "../../../../../shared/errors/AppError.js";
import type { ApproveDeviceByManagerUseCase } from "./ApproveDeviceByManagerUseCase.js";

export class ApproveDeviceByManagerController {
    constructor(private approveDeviceUseCase: ApproveDeviceByManagerUseCase) {}

    handle = async (req: Request, res: Response): Promise<Response> => {
        const manager_store_id = req.user?.store_id;
        
        if (!manager_store_id) {
            throw new AppError("Contexto de loja obrigatório", 403, "STORE_CONTEXT_REQUIRED");
        }

        const { target_user_id, device_id, device_name } = req.body;

        if (!target_user_id || !device_id || !device_name) {
            throw new AppError("Faltam parâmetros obrigatórios para aprovar o dispositivo.", 400, "MISSING_PARAMETERS");
        }

        await this.approveDeviceUseCase.execute({
            manager_store_id,
            target_user_id,
            device_id,
            device_name
        });

        // O controller finaliza rápido. Não emite JWT porque o front do funcionário 
        // vai voltar pra tela e fazer login novamente via /login.
        return res.status(200).json({ message: "Dispositivo aprovado com sucesso." });
    }
}