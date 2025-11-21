import type { CorsOptions } from 'cors';

import env from '@config/env.config';

const parsedOrigins =
  env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];
const origins = parsedOrigins.length > 0 ? parsedOrigins : [env.CLIENT_URL];

export const corsConfig: CorsOptions = {
  origin: origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

export default corsConfig;
