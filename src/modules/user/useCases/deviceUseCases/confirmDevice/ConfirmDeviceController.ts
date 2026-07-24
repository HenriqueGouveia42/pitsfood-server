import type { Request, Response } from "express";
import type { ConfirmDeviceUseCase } from "./ConfirmDeviceUseCase.js";
import { AppError } from "../../../../../shared/errors/AppError.js";
import type { CookieOptions } from "express";

export class ConfirmDeviceController {
    constructor(
        private confirmDeviceUseCase: ConfirmDeviceUseCase
    ) {}

    private getCookieOptions(maxAge?: number): CookieOptions {
        return {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            ...(maxAge && { maxAge }), // Só adiciona maxAge se for passado
            path: '/'
        };
    }

    handle = async (req: Request, res: Response): Promise<Response> => {
        
        const user_id = req.preAuthUserId;
        const isMobileClient: boolean = req.headers['x-client-type'] === 'mobile';
        
        if (!user_id) {
            throw new AppError("Acesso negado. Token de pré-autorização ausente.", 401, "PRE_AUTH_MISSING");
        }

        const { code } = req.body;
        const device_id = req.headers['x-device-id'] as string;
        
        if (!device_id) {
            throw new AppError("A identificação do dispositivo (x-device-id) é obrigatória.", 400, "MISSING_DEVICE_ID");
        }

        const userAgent = req.headers['user-agent'] || "Dispositivo Desconhecido";
        const device_name = (req.body.device_name || userAgent).substring(0, 40);

        const { token, user } = await this.confirmDeviceUseCase.execute({
            user_id,
            device_id,
            authorize_device_code: code,
            device_name
        });

        // Apaga o cookie temporário
        res.clearCookie('pre_auth_token', this.getCookieOptions());

        // Planta o cookie definitivo
        res.cookie('token', token, this.getCookieOptions(1000 * 60 * 60 * 24)); // 1 dia

        const responsePayload: any = {
            message: "Dispositivo autorizado e login realizado com sucesso",
            user: user
        }

        if(isMobileClient){
            responsePayload.token = token
        }
        
        return res.status(200).json(responsePayload);
    }
}