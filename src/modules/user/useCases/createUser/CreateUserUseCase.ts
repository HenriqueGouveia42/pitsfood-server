import type { IUserRepository } from "../../repositories/user.repository.interface.js";
import { User } from "../../entities/user.js";
import bcrypt from "bcryptjs";
import { UserRole } from "../../entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";

interface CreateUserUseCaseRequest{
    name: string,
    role: string,
    plain_text_password: string
}

export interface CreateUserUseCaseResponse{
    name: string,
    role: string,
}

export class CreateUserUseCase{
   constructor(
        private userRepository: IUserRepository
   ){} 

   async execute({ name, role, plain_text_password}: CreateUserUseCaseRequest): Promise<CreateUserUseCaseResponse>{

        const hashed_password = await bcrypt.hash(plain_text_password, 8);

        const user: User = User.buildUser(name, hashed_password, role as UserRole);

        await this.userRepository.saveUser(user);

        const response: CreateUserUseCaseResponse = {
            name: user.username,
            role: user.role,
        }

        return response;

   }
}