export interface IRedisService {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    incr(key: string): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<void>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    flushall(): Promise<void>;
    isReady(): boolean;
}
declare class RedisServiceWrapper implements IRedisService {
    private client;
    private fallback;
    private useFallback;
    constructor();
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    incr(key: string): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<void>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    flushall(): Promise<void>;
    isReady(): boolean;
}
export declare const redisService: RedisServiceWrapper;
export {};
