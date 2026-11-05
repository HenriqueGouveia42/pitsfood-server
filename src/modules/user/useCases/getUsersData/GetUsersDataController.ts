import { GetUsersDataUseCase } from "./GetUsersDataUseCase.js"
import { type GetUsersDataUseCaseOutputDTO } from "./GetUsersDataUseCase.js";
import type { IAuthenticatedHttpRequest, IController, IHttpResponse } from "../../../../shared/infra/http/protocols.js";

export type IAuthenticatedHttpRequestInputDTO = {
    active: string
}

export class GetUsersDataController implements IController{

    constructor(
        private getUsersDataUseCase: GetUsersDataUseCase
    ){}

    handle = async (req: IAuthenticatedHttpRequest): Promise<IHttpResponse> => {
        
        const { active } = req.query as IAuthenticatedHttpRequestInputDTO;
        const store_id = req.user.store_id;

        const users: GetUsersDataUseCaseOutputDTO[] = await this.getUsersDataUseCase.execute(store_id, active);

        return {
            statusCode: 200,
            body: users
        }
    }

}