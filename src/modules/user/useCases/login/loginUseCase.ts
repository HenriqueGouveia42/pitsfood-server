import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../entities/user.js"
import type { IUserRepository } from "../../repositories/user.repository.interface.js"

const { sign } = jwt;

interface IRequest {
    username: string,
    password: string
}

export interface ILoginResponse {
    token: string,
    user: {
        id: string,
        username: string,
        role: string
    }
}

export class LoginUseCase {

    //injecao de dependencia
    //o "LoginUseCase" pede as interfaces dos repositorios no construtor
    //quem vai entregar as implementacoes reais (Prisma por exemplo) é o arquivo index.ts (Factory)
    constructor(
        private userRepository: IUserRepository
    ) {}

    async execute({ username, password }:IRequest): Promise<ILoginResponse>{

        const user: User = await this.userRepository.findUserByUsername(username);

        if(!user){
            throw new Error("Usuário ou senha incorretos")
        }

        if (!user.active){
            throw new Error("Usuário inativo. Contate o administrador do sistema")
        }

        
        //comparar a senha enviada (plain-text) com o hash do banco
        const passwordMatch = await compare(password, user.passwordHash);

        if (!passwordMatch){
            throw new Error("Usuario ou senha incorretos")
        }

        const secret = process.env.JWT_SECRET;

        if(!secret){
            throw new Error("Erro interno: JWT_SECRET não configurado")
        }

        const token = sign(
            {
                userId: user.id,
                role:user.role
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
                username: user.username,
                role: user.role
            }
        };

    }
}