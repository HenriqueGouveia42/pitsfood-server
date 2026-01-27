export interface ICacheProvider {
    save(key: string, value: string, expireInSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    invalidate(key: string): Promise<void>;
}