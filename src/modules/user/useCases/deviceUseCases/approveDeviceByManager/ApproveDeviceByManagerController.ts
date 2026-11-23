import { AppError } from "../../../../../shared/errors/AppError.js";
import type { ApproveDeviceByManagerUseCase } from "./ApproveDeviceByManagerUseCase.js";
import type { IAuthenticatedHttpRequest, IController, IHttpResponse } from "../../../../../shared/infra/http/protocols.js";

export type ApproveDeviceByManagerControllerInputDTO = {
    manager_store_id: string
    target_user_id: string,
    device_id: string,
    device_name: string
}

export class ApproveDeviceByManagerController implements IController {

    constructor(private approveDeviceUseCase: ApproveDeviceByManagerUseCase) {}

    handle = async (req: IAuthenticatedHttpRequest): Promise<IHttpResponse> => {

        const manager_store_id: string = req.user.store_id;
        
        if (!manager_store_id) {
            throw new AppError("Contexto de loja obrigatório", 403, "STORE_CONTEXT_REQUIRED");
        }

        const { target_user_id, device_id, device_name } = req.body as ApproveDeviceByManagerControllerInputDTO;

        await this.approveDeviceUseCase.execute({
            manager_store_id,
            target_user_id,
            device_id,
            device_name
        });

        // O controller finaliza rápido. Não emite JWT porque o front do funcionário 
        // vai voltar pra tela e fazer login novamente via /login.
        return{
            statusCode: 200,
            body: {
                message: "Dispositivo aprovado com sucesso."
            }
        }
    }
}