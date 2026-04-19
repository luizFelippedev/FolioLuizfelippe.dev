import { getCache, setCache } from '@utils/cache/cache.service';
import axios from 'axios';

import env from '@config/env.config';

type NullableNumber = number | null;

interface InstagramFollowersCacheEntry {
  followers: NullableNumber;
}

const getFollowersCacheKey = (userId: string) => `metrics:instagram:followers:${userId}`;

const toNullableNumber = (value: unknown): NullableNumber => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
};

const resolveFollowersFromPayload = (payload: unknown): NullableNumber => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const asRecord = payload as Record<string, unknown>;

  const direct = toNullableNumber(asRecord.followers_count);
  if (direct !== null) {
    return direct;
  }

  const businessDiscovery = asRecord.business_discovery;
  if (businessDiscovery && typeof businessDiscovery === 'object') {
    return toNullableNumber((businessDiscovery as Record<string, unknown>).followers_count);
  }

  return null;
};

const fetchFollowersFromGraph = async (
  baseUrl: string,
  userId: string,
  accessToken: string
): Promise<NullableNumber> => {
  const response = await axios.get(`${baseUrl}/${userId}`, {
    params: {
      fields: 'followers_count',
      access_token: accessToken
    },
    timeout: 7_000
  });

  return resolveFollowersFromPayload(response.data);
};

export const fetchInstagramFollowers = async (): Promise<NullableNumber> => {
  const userId = env.INSTAGRAM_USER_ID?.trim();
  const accessToken = env.INSTAGRAM_ACCESS_TOKEN?.trim();

  if (!userId || !accessToken) {
    return null;
  }

  const cacheKey = getFollowersCacheKey(userId);
  const cached = await getCache<InstagramFollowersCacheEntry>(cacheKey);
  if (cached) {
    return cached.followers;
  }

  const endpoints = ['https://graph.instagram.com', 'https://graph.facebook.com/v20.0'];

  for (const endpoint of endpoints) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const followers = await fetchFollowersFromGraph(endpoint, userId, accessToken);
      if (followers !== null) {
        await setCache(cacheKey, { followers }, env.INSTAGRAM_METRICS_TTL_SECONDS);
        return followers;
      }
    } catch {
      // try next endpoint
    }
  }

  await setCache(cacheKey, { followers: null }, env.INSTAGRAM_METRICS_TTL_SECONDS);
  return null;
};
