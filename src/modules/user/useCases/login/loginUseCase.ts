import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../entities/user.js"
import type { IUserRepository } from "../../repositories/user.repository.interface.js"
import { AppError } from "../../../../shared/errors/AppError.js";

const { sign } = jwt;

interface IRequest {
    email: string,
    password: string,
}

export interface ILoginResponse {
    token: string,
    user: {
        id: string,
        username: string,
        role: string,
        store_id: string | undefined
    }
}

export class LoginUseCase {

    //injecao de dependencia
    //o "LoginUseCase" pede as interfaces dos repositorios no construtor
    //quem vai entregar as implementacoes reais (Prisma por exemplo) é o arquivo index.ts (Factory)
    constructor(
        private userRepository: IUserRepository
    ) {}

    async execute({ email, password }:IRequest): Promise<ILoginResponse>{

        const user: User = await this.userRepository.findUserByEmail(email);

        if(!user){
            throw new AppError("Email ou senha incorretos", 404, "INVALID_CREDENTIALS")
        }

        if (!user.active){
            throw new AppError("Usuário inativo. Contate o administrador do sistema", 403, "USER_DISABLED")
        }

        //comparar a senha enviada (plain-text) com o hash do banco
        const passwordMatch = await compare(password, user.passwordHash);

        if (!passwordMatch){
            throw new AppError("Usuario ou senha incorretos", 404, "INVALID_CREDENTIALS")
        }

        const secret = process.env.JWT_SECRET;

        if(!secret){
            throw new AppError("Erro interno: SECRET não configurado", 500, "SECRET_NOT_FOUND")
        }

        const token = sign(
            {
                userId: user.id,
                role: user.role,
                store_id: user.storeId ? user.storeId : null
            },
            secret,
            {
                subject: user.id,
                expiresIn: "1d"
            }
        )

        return {
            token,
            user: {
                id: user.id,
                store_id: user.storeId ? user.storeId : undefined,
                username: user.username,
                role: user.role
            }
        };

    }
}