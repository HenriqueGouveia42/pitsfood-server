export interface ICacheProvider {
    save(key: string, value: any, expireInSeconds?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    invalidate(key: string): Promise<void>;
}