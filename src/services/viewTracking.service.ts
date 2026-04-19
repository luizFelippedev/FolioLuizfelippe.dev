import crypto from 'node:crypto';

import { createRedisClient, getRedisClient } from '@config/redis.config';

type ViewContentType = 'blog' | 'project' | 'certificate';

interface TrackUniqueViewInput {
  contentType: ViewContentType;
  contentKey: string;
  ipAddress?: string | null;
}

interface TrackUniqueViewResult {
  counted: boolean;
}

const DEFAULT_UNIQUE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const memoryDedupe = new Map<string, number | null>();

const getTtlSeconds = () => {
  const raw = Number(process.env.VIEW_UNIQUE_TTL_SECONDS ?? DEFAULT_UNIQUE_TTL_SECONDS);
  if (!Number.isFinite(raw)) {
    return DEFAULT_UNIQUE_TTL_SECONDS;
  }

  return Math.max(0, Math.floor(raw));
};

const hashIp = (ipAddress: string) => {
  const salt = process.env.VIEW_HASH_SALT ?? process.env.JWT_ACCESS_SECRET ?? 'portfolio-view-salt';
  return crypto
    .createHash('sha256')
    .update(`${salt}:${ipAddress}`)
    .digest('hex');
};

const memoryMarkUnique = (dedupeKey: string, ttlSeconds: number): boolean => {
  const now = Date.now();
  const existingExpiresAt = memoryDedupe.get(dedupeKey);

  if (existingExpiresAt !== undefined) {
    if (existingExpiresAt === null || existingExpiresAt > now) {
      return false;
    }
  }

  memoryDedupe.set(dedupeKey, ttlSeconds > 0 ? now + ttlSeconds * 1000 : null);
  return true;
};

const trackWithRedis = async (
  dedupeKey: string,
  ttlSeconds: number
): Promise<boolean | null> => {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    return null;
  }

  let redis;

  try {
    redis = getRedisClient();
  } catch {
    try {
      redis = createRedisClient();
    } catch {
      return null;
    }
  }

  try {
    if (ttlSeconds > 0) {
      const status = await redis.set(dedupeKey, '1', 'EX', ttlSeconds, 'NX');
      return status === 'OK';
    }

    const status = await redis.set(dedupeKey, '1', 'NX');
    return status === 'OK';
  } catch {
    return null;
  }
};

export const trackUniqueView = async ({
  contentType,
  contentKey,
  ipAddress
}: TrackUniqueViewInput): Promise<TrackUniqueViewResult> => {
  if (!ipAddress) {
    return { counted: false };
  }

  const ttlSeconds = getTtlSeconds();
  const ipHash = hashIp(ipAddress);
  const dedupeKey = `views:unique:${contentType}:${contentKey}:${ipHash}`;

  const redisResult = await trackWithRedis(dedupeKey, ttlSeconds);
  if (redisResult !== null) {
    return { counted: redisResult };
  }

  return { counted: memoryMarkUnique(dedupeKey, ttlSeconds) };
};

export default trackUniqueView;
