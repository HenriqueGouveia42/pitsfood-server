import type { Request, Response } from "express";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { IUserRepository } from "../../repositories/interfaces/user.repository.interface.js";
import { User } from "../../entities/user.js";
import type { IAuthenticatedHttpRequest, IController, IHttpResponse } from "../../../../shared/infra/http/protocols.js";

interface IsLoggedInControllerOutputDTO {
    id: string,
    username: string,
    role: string,
    store_id: string | null,
    must_change_password: boolean,
}

export class IsLoggedInController implements IController {

    constructor(
        private userRepository: IUserRepository
    ){}

    handle = async(req: IAuthenticatedHttpRequest): Promise<IHttpResponse> => {

        const  user_id = req.user.id;
        const current_store_id = req.user?.store_id;

        const user: User | null = await this.userRepository.findSavedUserById(user_id);
        if (!user) throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND")
        
        const responsePayload: IsLoggedInControllerOutputDTO = {
            id: user.id,
            username: user.username,
            role: user.role,
            store_id: current_store_id ? current_store_id : null,
            must_change_password: user.mustChangePassword
        }

        return {
            statusCode: 200,
            body: responsePayload
        }
    
    }
}