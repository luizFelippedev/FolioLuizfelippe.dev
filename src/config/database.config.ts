import type { ConnectOptions } from 'mongoose';

import env, { isProduction } from './env.config';

export const databaseConfig = {
  url: env.DATABASE_URL,
  options: {
    autoIndex: !isProduction,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000
  } satisfies ConnectOptions
};

export default databaseConfig;
