import type { IUserRepository } from "../../repositories/user.repository.interface.js";
import { User } from "../../entities/user.js";
import bcrypt from "bcryptjs";
import { UserRole } from "../../entities/user.js";
import { AppError } from "../../../../shared/errors/AppError.js";

interface UserCreatesAnotherUserUseCaseRequest{
    name: string,
    role: string,
    plain_text_password: string,
    store_id: string,
    email: string
}

export interface UserCreatesAnotherUserUseCaseResponse{
    name: string,
    role: string,
}

export class UserCreatesAnotherUserUseCase{
   constructor(
        private userRepository: IUserRepository
   ){} 

   async execute({ name, role, plain_text_password, store_id, email}: UserCreatesAnotherUserUseCaseRequest): Promise<UserCreatesAnotherUserUseCaseResponse>{

        const hashed_password = await bcrypt.hash(plain_text_password, 8);

        const user: User = User.buildUser(name, hashed_password, role as UserRole, store_id, email);

        await this.userRepository.saveUser(user);

        const response: UserCreatesAnotherUserUseCaseResponse = {
            name: user.username,
            role: user.role,
        }

        return response;

   }
}