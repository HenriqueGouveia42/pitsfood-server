import { UpdateUserPasswordUseCase } from "./UpdateUserPasswordUsecase.js";
import type { IAuthenticatedHttpRequest, IController, IHttpResponse } from "../../../../shared/infra/http/protocols.js";

export type UpdateUserPasswordControllerInputDTO = {
    target_user_id: string,
    password: string
}

export class UpdateUserPasswordController implements IController
 {
    constructor(private updateUserPasswordUseCase: UpdateUserPasswordUseCase) {}

    handle = async (req: IAuthenticatedHttpRequest): Promise<IHttpResponse> => {

        const input: UpdateUserPasswordControllerInputDTO = {
            target_user_id: req.params,
            password: req.body
        }

        await this.updateUserPasswordUseCase.execute({
            target_user_id: input.target_user_id,
            modifier_user_id: req.user.id,
            modifier_user_store_id: req.user.store_id,
            password: input.password
        });

        return {
            statusCode: 200,
            body: {
                message: "Senha atualizada com sucesso"
            }
        }
    }
}