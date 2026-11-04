import Redis from 'ioredis';
import { env } from '../../config/env';

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

class MemoryRedisStore implements IRedisService {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const nextVal = current ? parseInt(current, 10) + 1 : 1;
    const entry = this.store.get(key);
    this.store.set(key, {
      value: nextVal.toString(),
      expiresAt: entry?.expiresAt,
    });
    return nextVal;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    const remaining = Math.round((entry.expiresAt - Date.now()) / 1000);
    if (remaining <= 0) {
      this.store.delete(key);
      return -2;
    }
    return remaining;
  }

  async keys(pattern: string): Promise<string[]> {
    const now = Date.now();
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }

  async flushall(): Promise<void> {
    this.store.clear();
  }

  isReady(): boolean {
    return true;
  }
}

class RedisServiceWrapper implements IRedisService {
  private client: Redis | null = null;
  private fallback: MemoryRedisStore = new MemoryRedisStore();
  private useFallback: boolean = true;

  constructor() {
    if (!env.USE_MEMORY_REDIS && env.REDIS_URL) {
      try {
        const client = new Redis(env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null, // Don't crash if offline
        });

        client.connect().then(() => {
          this.client = client;
          this.useFallback = false;
          console.log('✅ Real Redis connected successfully at ' + env.REDIS_URL);
        }).catch(() => {
          this.useFallback = true;
          console.log('ℹ️ Redis unreachable. Falling back to Embedded High-Performance In-Memory Cache.');
        });
      } catch {
        this.useFallback = true;
      }
    } else {
      this.useFallback = true;
      console.log('ℹ️ Using Embedded In-Memory Redis Store (TTL & Atomic Ops enabled).');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.useFallback && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        return this.fallback.get(key);
      }
    }
    return this.fallback.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.useFallback && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        return this.fallback.set(key, value, ttlSeconds);
      }
    }
    return this.fallback.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (!this.useFallback && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        return this.fallback.del(key);
      }
    }
    return this.fallback.del(key);
  }

  async incr(key: string): Promise<number> {
    if (!this.useFallback && this.client) {
      try {
        return await this.client.incr(key);
      } catch {
        return this.fallback.incr(key);
      }
    }
    return this.fallback.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.useFallback && this.client) {
      try {
        await this.client.expire(key, ttlSeconds);
        return;
      } catch {
        return this.fallback.expire(key, ttlSeconds);
      }
    }
    return this.fallback.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    if (!this.useFallback && this.client) {
      try {
        return await this.client.ttl(key);
      } catch {
        return this.fallback.ttl(key);
      }
    }
    return this.fallback.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.useFallback && this.client) {
      try {
        return await this.client.keys(pattern);
      } catch {
        return this.fallback.keys(pattern);
      }
    }
    return this.fallback.keys(pattern);
  }

  async flushall(): Promise<void> {
    if (!this.useFallback && this.client) {
      try {
        await this.client.flushall();
        return;
      } catch {
        return this.fallback.flushall();
      }
    }
    return this.fallback.flushall();
  }

  isReady(): boolean {
    return true;
  }
}

export const redisService = new RedisServiceWrapper();
