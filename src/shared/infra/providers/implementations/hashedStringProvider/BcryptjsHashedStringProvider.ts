import type { IHashedStringProvider } from "../IHashedStringProvider.js";
import { hash, compare } from "bcryptjs";

export class BcryptjsHashedStringProvider implements IHashedStringProvider{

    public async hashString(string_input: string): Promise<string>{
        const hashed: string = await hash(string_input, 8);
        return hashed;
    }

    public async compare(plain_password: string, hashed_password: string): Promise<boolean> {
        const password_match: boolean = await compare(plain_password, hashed_password);
        return password_match
    }
}