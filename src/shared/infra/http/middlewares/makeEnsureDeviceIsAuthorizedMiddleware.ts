import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../errors/AppError.js";
import { User } from "../../../../modules/user/entities/user.js";
import { CacheKeys } from "../../../constants/cache-keys.js";
import { cacheProvider } from "../../../providers/CacheProvider/index.js";
import type { IUserRepository } from "../../../../modules/user/repositories/interfaces/user.repository.interface.js";


export function makeEnsureDeviceIsAuthorizedMiddleware(userRepository: IUserRepository){

    return async function ensureDeviceIsAuthorizedMiddleware(
        request: Request,
        response: Response,
        next: NextFunction
    ) {
        
        // 1. Verifica se o usuário já passou pelo middleware de autenticação (JWT)
        if (!request.user) {
            throw new AppError("Erro interno: Usuário não autenticado no contexto.", 500, "INTERNAL_SERVER_ERROR");
        }

        // 2. Captura o ID do dispositivo que agora vem em TODAS as requisições do front-end
        const current_device_id = request.headers['x-device-id'] as string;

        if (!current_device_id) {
            throw new AppError("Identificação do dispositivo (x-device-id) ausente.", 400, "MISSING_DEVICE_ID");
        }

        const cache_key: string = CacheKeys.User.AUTHORIZED_DEVICES_IDS(request.user.id);

        let authorized_devices_ids = await cacheProvider.get<string[]>(cache_key);

        if (!authorized_devices_ids) {
        
            const user: User | null = await userRepository.findSavedUserById(request.user.id);
            
            if (!user) {
                throw new AppError("Usuário não encontrado ao tentar verificar dispositivo.", 404, "USER_NOT_FOUND");
            } 

            if (!user.authorized_devices || user.authorized_devices.length === 0) {
                throw new AppError("Usuário não possui nenhum dispositivo autorizado.", 401, "DEVICE_NOT_AUTHORIZED");
            }

            authorized_devices_ids = user.authorized_devices.map((device: any) => device.device_id || device);

            await cacheProvider.save(cache_key, authorized_devices_ids, 86400);
        }

        // 5. Verificação Final: O dispositivo da requisição atual está na lista dos autorizados?
        if (!authorized_devices_ids.includes(current_device_id)) {
            throw new AppError("Este dispositivo não está autorizado a acessar o sistema.", 403, "DEVICE_NOT_AUTHORIZED");
        }

        // 6. Tudo certo, dispositivo autorizado!
        return next();

    
    }

}