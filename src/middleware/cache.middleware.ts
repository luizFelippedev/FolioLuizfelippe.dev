import { getCache, setCache } from '@utils/cache/cache.service';
import type { NextFunction, Request, Response } from 'express';


export type CacheKeyBuilder = (req: Request) => string;

export const cacheResponse = (buildKey: CacheKeyBuilder, ttlSeconds = 60) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const key = buildKey(req);
    const cached = await getCache<unknown>(key);

    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      void setCache(key, body, ttlSeconds).catch(() => undefined);
      return originalJson(body);
    };

    return next();
  };

export default cacheResponse;
