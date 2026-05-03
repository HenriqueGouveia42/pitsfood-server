import type { IUserRepository } from "../interfaces/user.repository.interface.js";
import { User } from "../../entities/user.js";

export class InMemoryUserRepository implements IUserRepository {
    
    public items: User[] = [];

    async saveUser(user: User): Promise<void> {
        this.items.push(user);
    }

   
    async findSavedUserById(user_id: string): Promise<User | null> {
        const user: User | undefined = this.items.find(item => item.id === user_id);
        return user ? user : null
    }

    async updateSavedUser(user: User): Promise<void> {

        const index = this.items.findIndex(item => item.id === user.id);
        
        if (index !== -1) {
            this.items[index] = user;
        }
    }

    async listAllSavedUsers(store_id: string, active?: boolean): Promise<User[]> {

        let filteredUsers: User[] = this.items.filter(item => item.storeId === store_id);

        if (active !== undefined) {
            filteredUsers = filteredUsers.filter(item => item.active === active);
        }

        return filteredUsers;
    }

    async findUserByEmail(email: string): Promise<User | null> {

        const user: User | undefined = this.items.find(item => item.email === email);

        return user ? user : null
    }

    async findUserByCPFCNPJ(cpf_cnpj: string): Promise<User | null> {
        
        const user: User | undefined = this.items.find(item => item.cpf_cnpj === cpf_cnpj);
        return user ? user : null
    }
}