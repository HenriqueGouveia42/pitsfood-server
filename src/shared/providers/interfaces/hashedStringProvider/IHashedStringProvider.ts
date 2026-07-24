export interface IHashedStringProvider{
    hashString(input_string: string): Promise<string>
    compare(plain_password: string, hashed_password: string): Promise<boolean>
}