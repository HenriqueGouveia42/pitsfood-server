import { hash } from "bcryptjs"; 
import type { IUserRepository } from "../../repositories/user.repository.interface.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { User } from "../../entities/user.js";
import { UserRole } from "../../entities/user.js"; // Importante para usar no if

export interface IRequestUseCase {
    to_update_user_id: string;
    name?: string | undefined;
    password?: string | undefined;
    active?: boolean | undefined;
    id_gestor_trying_to_update_data: string
}

export class UpdateUserDataUseCase {

    constructor(private userRepository: IUserRepository) {}

    async execute({ 
        to_update_user_id, 
        name, 
        password, 
        active, 
        id_gestor_trying_to_update_data 
    }: IRequestUseCase): Promise<void> {
        
        //1 - Busca o usuário alvo
        const user_target: User = await this.userRepository.findSavedUserById(to_update_user_id);

        if(!user_target){
            throw new AppError("Usuario nao encontrado", 404, "USER_NOT_FOUND")
        }

        //2 - Identifica o Main Gestor
        const mainGestorId: string | null = await this.userRepository.getMainGestorId();

        //3 - Regras de Hierarquia do Main Gestor
        if (mainGestorId) {
            
            //se o usuário ALVO é o Main Gestor...
            if(to_update_user_id === mainGestorId){
                // ...e quem está tentando mexer NÃO É ele mesmo => BLOQUEIA TUDO.
                if(id_gestor_trying_to_update_data !== mainGestorId){
                    throw new AppError("Você não tem permissão para alterar ou desativar o Gestor Principal.", 403, "FORBIDDEN_OPERATION")
                }

                // ...se for ele mesmo, passamos para a próxima validação (a de desativar)
            }

            if (user_target.role === UserRole.GESTOR && 
                id_gestor_trying_to_update_data !== mainGestorId && 
                id_gestor_trying_to_update_data !== to_update_user_id
            ) {
                throw new AppError("Apenas o Gestor Principal pode alterar outros Gestores.", 403, "FORBIDDEN_OPERATION");
            }
        }

        //4 - Regra de Auto-Sabotagem (Main Gestor não pode se desativar)
        if (to_update_user_id === mainGestorId && active === false) {
            throw new AppError("O Gestor Principal não pode ser desativado, pois isso bloquearia o sistema.", 400, "SYSTEM_SAFETY_LOCK");
        }

        //5 - Prepara os dados
        const finalName: string = (name !== undefined) ? name : user_target.username;
        const finalActive: boolean = (active !== undefined) ? active : user_target.active;

        let finalPasswordHash: string = user_target.passwordHash;
        
        if (password !== undefined){
            finalPasswordHash = await hash(password, 8);
        }

        // 6 - tualiza a Entidade
        const updatedUser: User = user_target.withUpdatedData(finalName, finalPasswordHash, finalActive);

        //7 - Salva
        await this.userRepository.updateSavedUser(updatedUser);
    }
}