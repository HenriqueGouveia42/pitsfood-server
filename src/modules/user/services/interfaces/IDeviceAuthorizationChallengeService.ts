import { User } from "../../entities/user.js";
import type { LoginResult } from "../../useCases/login/loginUseCase.js";

export interface IDeviceAuthorizationChallengeService {
    execute(user: User, device_id: string): Promise<LoginResult>;
}