interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCached<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.timestamp > ttlMs) {
    memoryCache.delete(key);
    return null;
  }
  return hit.data as T;
}

export function setCached<T>(key: string, data: T): T {
  memoryCache.set(key, { data, timestamp: Date.now() });
  return data;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
