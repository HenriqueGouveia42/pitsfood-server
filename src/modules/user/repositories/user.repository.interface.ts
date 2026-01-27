import { User } from "../entities/user.js";

export interface IUserRepository {
    saveUser(user: User): Promise<void>;
    findSavedUserById(user_id: string): Promise<User | null>;
    updateSavedUser(user: User): Promise<void>;
    listAllSavedUsers(store_id: string, active?: boolean | undefined): Promise<User[]>;
    findUserByEmail(email: string): Promise<User | null>;
}