import { UpdateUserNameUseCase } from "./UpdateUserNameUseCase.js";
import type { IAuthenticatedHttpRequest, IController, IHttpResponse } from "../../../../shared/infra/http/protocols.js";

export type UpdateUserNameControllerInputDTO = {
    target_user_id: string;
    modifier_user_id: string;
    modifier_user_store_id: string;
    name: string;
}

export class UpdateUserNameController implements IController {

    constructor(private updateUserNameUseCase: UpdateUserNameUseCase) {}

    handle = async (req: IAuthenticatedHttpRequest<{ name: string }, { target_user_id: string }>): Promise<IHttpResponse> => {

        const input: UpdateUserNameControllerInputDTO = {
            target_user_id: req.params!.target_user_id,
            modifier_user_id: req.user.id,
            modifier_user_store_id: req.user.store_id,
            name: req.body!.name
        };

        await this.updateUserNameUseCase.execute(input);

        return {
            statusCode: 200,
            body: { message: "Nome do usuário atualizado com sucesso" }
        };
    }
}