import type { Request, Response } from "express"
import type { CreateStoreUseCase } from "./CreateStoreUseCase.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { Store } from "../../entities/store.js";
import jwt from "jsonwebtoken";
const { sign } = jwt;

export class CreateStoreController{

    constructor(
        private createStoreUseCase: CreateStoreUseCase
    ){}

    public async handle(req:Request, res: Response): Promise<Response>{
        try{

            let { store_name, cnpj, active=true } = req.body

            const owner_id: string = req.user.id;

            const created_store: Store = await this.createStoreUseCase.execute({
                store_name,
                cnpj,
                active,
                owner_id
            });

            //LOGICA DE ENVIAR O NOVO JWT JA COM STORE_ID ATUALIZADO E RETORNO NORMAL DO CONTROLLER
            //O TOKEN JWT AGORA DEVE SABER QUE ESSE USUARIO AGORA TEM UMA LOJA!!

            const secret = process.env.JWT_SECRET;

            if(!secret){
                throw new AppError("Erro interno: SECRET não configurado", 500, "SECRET_NOT_FOUND")
            }
        
            const newToken = sign(
                {
                    userId: req.user.id,
                    role: req.user.role,
                    store_id: created_store.id, //RECEBE O ID DA NOVA LOJA CRIADA
                    must_change_password: req.user.must_change_password
                },
                secret,
                {
                    subject: req.user.id,
                    expiresIn: "1d"
                }
            )

            res.cookie('token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24,
                path: '/'
            })

            return res.status(200).json({message: "Loja criada com sucesso!"})


        }catch(error){

            if(error instanceof AppError){
                return res.status(error.statusCode).json({message: error.errorCode});
            }

            return res.status(500).json({message: "Erro interno ao criar loja"})
        }
    }

}