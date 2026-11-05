import type { GetPendingDevicesUseCase, GetPendingDevicesUseCaseOutputDTO } from "./GetPendingDevicesUseCase.js";
import type { IAuthenticatedHttpRequest, IController, IHttpResponse } from "../../../../../shared/infra/http/protocols.js";

export class GetPendingDevicesController implements IController {

    constructor(
        private getPendingDevicesUseCase: GetPendingDevicesUseCase
    ) {}

    handle = async (req: IAuthenticatedHttpRequest): Promise<IHttpResponse> => {
        
        const store_id = req.user.store_id;

        const pendingDevices: GetPendingDevicesUseCaseOutputDTO[] = await this.getPendingDevicesUseCase.execute(store_id);

        return{
            statusCode: 200,
            body: pendingDevices
        }

    }
}