import type { Redis } from 'ioredis';

import env, { isTest } from '@config/env.config';
import { createRedisClient, getRedisClient } from '@config/redis.config';

interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  clearPrefix(prefix: string): Promise<void>;
}

class MemoryCache implements CacheClient {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
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

  async clearPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

let memoryCache: MemoryCache | null = null;

const getMemoryCache = () => {
  if (!memoryCache) {
    memoryCache = new MemoryCache();
  }
  return memoryCache;
};

const getClient = (): CacheClient => {
  if (!env.REDIS_URL || isTest) {
    return getMemoryCache();
  }

  try {
    const redis = ((): Redis => {
      try {
        return getRedisClient();
      } catch {
        return createRedisClient();
      }
    })();

    return {
      async get(key: string) {
        return redis.get(key);
      },
      async set(key: string, value: string, ttlSeconds?: number) {
        if (ttlSeconds && ttlSeconds > 0) {
          await redis.set(key, value, 'EX', ttlSeconds);
        } else {
          await redis.set(key, value);
        }
      },
      async del(key: string) {
        await redis.del(key);
      },
      async clearPrefix(prefix: string) {
        let cursor = '0';
        const match = `${prefix}*`;
        do {
          const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', match, 'COUNT', 100);
          cursor = nextCursor;
          if (keys.length) {
            await redis.del(...keys);
          }
        } while (cursor !== '0');
      }
    } satisfies CacheClient;
  } catch {
    return getMemoryCache();
  }
};

const client = getClient();

export const setCache = async (key: string, value: unknown, ttlSeconds = 60) => {
  const serialized = JSON.stringify(value);
  await client.set(key, serialized, ttlSeconds > 0 ? ttlSeconds : undefined);
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const cached = await client.get(key);
  if (!cached) {
    return null;
  }

  try {
    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
};

export const invalidateCache = async (key: string) => {
  await client.del(key);
};

export const invalidateCachePrefix = async (prefix: string) => {
  await client.clearPrefix(prefix);
};

export default {
  setCache,
  getCache,
  invalidateCache,
  invalidateCachePrefix
};
