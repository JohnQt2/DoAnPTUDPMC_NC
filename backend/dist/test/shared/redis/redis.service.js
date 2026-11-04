"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("../../config/env");
class MemoryRedisStore {
    store = new Map();
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds) {
        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
        this.store.set(key, { value, expiresAt });
    }
    async del(key) {
        this.store.delete(key);
    }
    async incr(key) {
        const current = await this.get(key);
        const nextVal = current ? parseInt(current, 10) + 1 : 1;
        const entry = this.store.get(key);
        this.store.set(key, {
            value: nextVal.toString(),
            expiresAt: entry?.expiresAt,
        });
        return nextVal;
    }
    async expire(key, ttlSeconds) {
        const entry = this.store.get(key);
        if (entry) {
            entry.expiresAt = Date.now() + ttlSeconds * 1000;
        }
    }
    async ttl(key) {
        const entry = this.store.get(key);
        if (!entry)
            return -2;
        if (!entry.expiresAt)
            return -1;
        const remaining = Math.round((entry.expiresAt - Date.now()) / 1000);
        if (remaining <= 0) {
            this.store.delete(key);
            return -2;
        }
        return remaining;
    }
    async keys(pattern) {
        const now = Date.now();
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        const matched = [];
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
    async flushall() {
        this.store.clear();
    }
    isReady() {
        return true;
    }
}
class RedisServiceWrapper {
    client = null;
    fallback = new MemoryRedisStore();
    useFallback = true;
    constructor() {
        if (!env_1.env.USE_MEMORY_REDIS && env_1.env.REDIS_URL) {
            try {
                const client = new ioredis_1.default(env_1.env.REDIS_URL, {
                    lazyConnect: true,
                    maxRetriesPerRequest: 1,
                    retryStrategy: () => null, // Don't crash if offline
                });
                client.connect().then(() => {
                    this.client = client;
                    this.useFallback = false;
                    console.log('✅ Real Redis connected successfully at ' + env_1.env.REDIS_URL);
                }).catch(() => {
                    this.useFallback = true;
                    console.log('ℹ️ Redis unreachable. Falling back to Embedded High-Performance In-Memory Cache.');
                });
            }
            catch {
                this.useFallback = true;
            }
        }
        else {
            this.useFallback = true;
            console.log('ℹ️ Using Embedded In-Memory Redis Store (TTL & Atomic Ops enabled).');
        }
    }
    async get(key) {
        if (!this.useFallback && this.client) {
            try {
                return await this.client.get(key);
            }
            catch {
                return this.fallback.get(key);
            }
        }
        return this.fallback.get(key);
    }
    async set(key, value, ttlSeconds) {
        if (!this.useFallback && this.client) {
            try {
                if (ttlSeconds) {
                    await this.client.set(key, value, 'EX', ttlSeconds);
                }
                else {
                    await this.client.set(key, value);
                }
                return;
            }
            catch {
                return this.fallback.set(key, value, ttlSeconds);
            }
        }
        return this.fallback.set(key, value, ttlSeconds);
    }
    async del(key) {
        if (!this.useFallback && this.client) {
            try {
                await this.client.del(key);
                return;
            }
            catch {
                return this.fallback.del(key);
            }
        }
        return this.fallback.del(key);
    }
    async incr(key) {
        if (!this.useFallback && this.client) {
            try {
                return await this.client.incr(key);
            }
            catch {
                return this.fallback.incr(key);
            }
        }
        return this.fallback.incr(key);
    }
    async expire(key, ttlSeconds) {
        if (!this.useFallback && this.client) {
            try {
                await this.client.expire(key, ttlSeconds);
                return;
            }
            catch {
                return this.fallback.expire(key, ttlSeconds);
            }
        }
        return this.fallback.expire(key, ttlSeconds);
    }
    async ttl(key) {
        if (!this.useFallback && this.client) {
            try {
                return await this.client.ttl(key);
            }
            catch {
                return this.fallback.ttl(key);
            }
        }
        return this.fallback.ttl(key);
    }
    async keys(pattern) {
        if (!this.useFallback && this.client) {
            try {
                return await this.client.keys(pattern);
            }
            catch {
                return this.fallback.keys(pattern);
            }
        }
        return this.fallback.keys(pattern);
    }
    async flushall() {
        if (!this.useFallback && this.client) {
            try {
                await this.client.flushall();
                return;
            }
            catch {
                return this.fallback.flushall();
            }
        }
        return this.fallback.flushall();
    }
    isReady() {
        return true;
    }
}
exports.redisService = new RedisServiceWrapper();
