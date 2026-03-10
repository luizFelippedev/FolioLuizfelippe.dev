import logger from '@utils/logger/logger';
import type { RedisOptions } from 'ioredis';
import { Redis } from 'ioredis';

import env from '@config/env.config';


let client: Redis | null = null;

export const createRedisClient = (): Redis => {
  if (client) {
    return client;
  }

  if (!env.REDIS_URL) {
    throw new Error('REDIS_URL is not configured');
  }

  const options: RedisOptions = {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true
  };

  client = new Redis(env.REDIS_URL, options);

  client.on('connect', () => logger.info('Redis client connected'));
  client.on('error', (error) => logger.error('Redis client error', { error }));

  return client;
};

export const getRedisClient = (): Redis => {
  if (!client) {
    return createRedisClient();
  }

  return client;
};

export const disconnectRedis = async (): Promise<void> => {
  if (client) {
    await client.quit();
    logger.info('Redis client disconnected');
    client = null;
  }
};
