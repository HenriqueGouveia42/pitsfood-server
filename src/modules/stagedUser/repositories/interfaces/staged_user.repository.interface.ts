import { StagedUser } from "../../entities/stagedUser.js";
import { User } from "../../../user/entities/user.js";

export interface IStagedUserRepository{
    saveStagedUser(stagedUser: StagedUser): Promise<void>;
    findStagedUserById(staged_user_id: string): Promise <StagedUser | null>;
    findStagedUserByEmail(email: string): Promise<StagedUser | null>;
    deleteStagedUserById(staged_user_id: string): Promise <void>;
    deleteStagedUserAndCreateUser(staged_user: StagedUser, user: User): Promise<void>;
}